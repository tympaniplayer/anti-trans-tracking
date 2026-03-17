"""Classify bills using Claude API for relevance, sentiment, and category."""

import hashlib
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from anthropic import Anthropic

from config import (
    ANTHROPIC_API_KEY,
    CLASSIFIER_MODEL,
    CLASSIFIER_CACHE_FILE,
)
from categorizer import categorize_bill as keyword_categorize

SYSTEM_PROMPT = """You classify legislative bills related to transgender/LGBTQ+ policy.
Respond ONLY with valid JSON matching this exact schema:
{"relevant": boolean, "sentiment": "restrictive" | "protective" | "neutral", "primary_category": string, "categories": [string], "confidence": number}

Valid categories: healthcare, sports, bathrooms, education, drag, identity_documents, religious_exemptions, definitions, other

Rules:
- "relevant": true if the bill directly and specifically impacts transgender, nonbinary, or LGBTQ+ people. False for bills that merely mention sex/gender in passing (e.g. general civil rights boilerplate, sex offender registries, generic health insurance, domestic violence).
- "sentiment": "restrictive" if the bill restricts, bans, or limits trans rights, access, or care. "protective" if it protects, expands, or affirms trans/LGBTQ+ rights. "neutral" if procedural, definitional without clear impact, or genuinely ambiguous.
- Choose categories based on the bill's primary subject matter. Use "other" only when no specific category fits.
- "confidence": 0.0 to 1.0 indicating how confident you are in the classification."""


def _bill_hash(title, description):
    """Create a hash of bill content for cache invalidation."""
    content = f"{title}|{description}"
    return hashlib.md5(content.encode()).hexdigest()


def _load_cache():
    """Load the classification cache from disk."""
    if os.path.exists(CLASSIFIER_CACHE_FILE):
        with open(CLASSIFIER_CACHE_FILE, "r") as f:
            return json.load(f)
    return {}


def _save_cache(cache):
    """Save the classification cache to disk."""
    os.makedirs(os.path.dirname(CLASSIFIER_CACHE_FILE), exist_ok=True)
    with open(CLASSIFIER_CACHE_FILE, "w") as f:
        json.dump(cache, f, indent=2)


def _classify_single(client, title, description, sponsors, subjects):
    """Classify a single bill via the Claude API."""
    user_message = f"""Title: {title}
Description: {description}
Sponsors: {sponsors}
Subjects: {subjects}"""

    response = client.messages.create(
        model=CLASSIFIER_MODEL,
        max_tokens=256,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    text = response.content[0].text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("\n", 1)[1]  # remove first line (```json)
        text = text.rsplit("```", 1)[0]  # remove closing ```
        text = text.strip()
    return json.loads(text)


def _validate_result(result):
    """Validate and normalize a classification result."""
    valid_sentiments = {"restrictive", "protective", "neutral"}
    valid_categories = {
        "healthcare", "sports", "bathrooms", "education", "drag",
        "identity_documents", "religious_exemptions", "definitions", "other",
    }

    if not isinstance(result, dict):
        return None

    sentiment = result.get("sentiment", "neutral")
    if sentiment not in valid_sentiments:
        sentiment = "neutral"

    primary = result.get("primary_category", "other")
    if primary not in valid_categories:
        primary = "other"

    categories = result.get("categories", [primary])
    categories = [c for c in categories if c in valid_categories]
    if not categories:
        categories = [primary]

    return {
        "relevant": bool(result.get("relevant", True)),
        "sentiment": sentiment,
        "primary_category": primary,
        "categories": categories,
        "confidence": min(1.0, max(0.0, float(result.get("confidence", 0.5)))),
    }


def _fallback_classify(title, description):
    """Fall back to keyword-based classification when API is unavailable."""
    cat_result = keyword_categorize(title, description)
    return {
        "relevant": True,
        "sentiment": "neutral",
        "primary_category": cat_result["primary_category"],
        "categories": cat_result["categories"],
        "confidence": 0.0,
    }


def classify_bill(client, bill_id, title, description, sponsors, subjects, cache):
    """
    Classify a single bill, using cache when available.

    Returns:
        dict with relevant, sentiment, primary_category, categories, confidence
    """
    content_hash = _bill_hash(title, description)
    cache_key = str(bill_id)

    # Check cache
    if cache_key in cache and cache[cache_key].get("hash") == content_hash:
        return cache[cache_key]["result"]

    # Classify via API
    try:
        result = _classify_single(client, title, description, sponsors, subjects)
        result = _validate_result(result)
        if result is None:
            raise ValueError("Invalid classification result")
    except Exception as e:
        print(f"    Classification failed for {bill_id}: {e}, using fallback")
        result = _fallback_classify(title, description)

    # Update cache
    cache[cache_key] = {"hash": content_hash, "result": result}
    return result


def batch_classify(bills_to_classify, max_workers=3):
    """
    Classify multiple bills concurrently.

    Args:
        bills_to_classify: list of dicts with keys:
            bill_id, title, description, sponsors, subjects
        max_workers: number of concurrent API calls

    Returns:
        dict mapping bill_id -> classification result
    """
    if not ANTHROPIC_API_KEY:
        print("  No ANTHROPIC_API_KEY set, using keyword fallback for all bills")
        results = {}
        for bill in bills_to_classify:
            results[bill["bill_id"]] = _fallback_classify(
                bill["title"], bill["description"]
            )
        return results

    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    cache = _load_cache()
    results = {}
    api_calls = 0
    cache_hits = 0

    def classify_one(bill):
        return bill["bill_id"], classify_bill(
            client,
            bill["bill_id"],
            bill["title"],
            bill["description"],
            bill["sponsors"],
            bill["subjects"],
            cache,
        )

    # Check how many actually need API calls
    for bill in bills_to_classify:
        content_hash = _bill_hash(bill["title"], bill["description"])
        cache_key = str(bill["bill_id"])
        if cache_key in cache and cache[cache_key].get("hash") == content_hash:
            cache_hits += 1

    need_api = len(bills_to_classify) - cache_hits
    print(f"  Classification: {cache_hits} cached, {need_api} need API calls")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {}
        for bill in bills_to_classify:
            future = executor.submit(classify_one, bill)
            futures[future] = bill["bill_id"]
            # Rate limit: small delay between submissions
            time.sleep(0.1)

        for future in as_completed(futures):
            try:
                bill_id, result = future.result()
                results[bill_id] = result
                if result.get("confidence", 0) > 0:
                    api_calls += 1
            except Exception as e:
                bill_id = futures[future]
                print(f"    Error classifying bill {bill_id}: {e}")
                # Find the bill and use fallback
                for bill in bills_to_classify:
                    if bill["bill_id"] == bill_id:
                        results[bill_id] = _fallback_classify(
                            bill["title"], bill["description"]
                        )
                        break

    _save_cache(cache)
    print(f"  Made {api_calls} API calls, {cache_hits} cache hits")
    return results
