#!/usr/bin/env python3
"""
Main scraper script for the Anti-Trans Legislation Tracker.

Searches LegiScan for anti-trans bills, categorizes them, and outputs
JSON data files for the static frontend.
"""

import argparse
import json
import os
import sys
import time
from collections import defaultdict
from datetime import datetime, timezone

from config import (
    SEARCH_KEYWORDS,
    DATA_DIR,
    BILLS_DIR,
    BILLS_JSON,
    STATES_JSON,
    METADATA_JSON,
    STATUS_MAP,
    STATUS_SIMPLIFIED,
    STATE_NAMES,
    MAX_SEARCH_PAGES,
    MIN_RELEVANCE,
    LEGISCAN_API_KEY,
)
from legiscan_client import LegiScanClient, LegiScanError
from categorizer import categorize_bill


def load_existing_bills():
    """Load existing bills.json if it exists for incremental updates."""
    if os.path.exists(BILLS_JSON):
        with open(BILLS_JSON, "r") as f:
            bills = json.load(f)
            return {b["id"]: b for b in bills}
    return {}


def search_all_keywords(client):
    """Search LegiScan for all configured keywords and collect unique bill IDs."""
    found_bills = {}  # bill_id -> search result entry

    for keyword in SEARCH_KEYWORDS:
        print(f"Searching for: {keyword}")
        try:
            page = 1
            while page <= MAX_SEARCH_PAGES:
                result = client.search(keyword, page=page)
                summary = result.get("summary", {})
                results = result.get("results", {})

                if not results:
                    break

                for bill_info in results:
                    if not isinstance(bill_info, dict):
                        continue
                    relevance = bill_info.get("relevance", 0)
                    if relevance < MIN_RELEVANCE:
                        continue
                    bill_id = bill_info.get("bill_id")
                    if bill_id and bill_id not in found_bills:
                        found_bills[bill_id] = bill_info

                # Check if there are more pages
                total_pages = summary.get("page_total", 1)
                if page >= total_pages:
                    break
                page += 1

            count = len(found_bills)
            print(f"  Found {count} unique bills so far")

        except LegiScanError as e:
            print(f"  Error searching for '{keyword}': {e}")
            continue

    return found_bills


def fetch_bill_details(client, bill_id, existing_bills):
    """Fetch full bill details, using cache when possible."""
    # Check if we already have this bill and it hasn't been updated
    if bill_id in existing_bills:
        existing = existing_bills[bill_id]
        # We'll re-fetch to check for updates (status changes, new actions)

    try:
        bill = client.get_bill(bill_id)
        return bill
    except LegiScanError as e:
        print(f"  Error fetching bill {bill_id}: {e}")
        return None


def determine_level(bill):
    """Determine government level (federal, state, local) from bill data."""
    state = bill.get("state", "")
    if state == "US":
        return "federal"
    # LegiScan primarily covers state-level legislation
    # Local bills would need a different data source
    return "state"


def process_bill(bill_data, search_info):
    """Process a raw bill from LegiScan into our summary format."""
    bill_id = bill_data.get("bill_id", 0)
    state = bill_data.get("state", "")
    title = bill_data.get("title", "")
    description = bill_data.get("description", "")
    status_code = bill_data.get("status", 0)
    bill_number = bill_data.get("bill_number", "")

    # Categorize
    cat_result = categorize_bill(title, description)

    # Get sponsors
    sponsors = []
    for sponsor in bill_data.get("sponsors", []):
        name = sponsor.get("name", "")
        party = sponsor.get("party", "")
        role = sponsor.get("role", "")
        if name:
            sponsor_str = name
            if party:
                sponsor_str += f" ({party})"
            if role:
                sponsor_str += f" [{role}]"
            sponsors.append(sponsor_str)

    # Get action history
    actions = []
    for action in bill_data.get("history", []):
        actions.append({
            "date": action.get("date", ""),
            "action": action.get("action", ""),
            "chamber": action.get("chamber", ""),
        })

    # Get votes
    votes = []
    for vote in bill_data.get("votes", []):
        votes.append({
            "date": vote.get("date", ""),
            "description": vote.get("desc", ""),
            "yea": vote.get("yea", 0),
            "nay": vote.get("nay", 0),
            "passed": vote.get("passed", 0),
        })

    # Get text documents
    texts = []
    for text in bill_data.get("texts", []):
        texts.append({
            "date": text.get("date", ""),
            "type": text.get("type", ""),
            "url": text.get("state_link", "") or text.get("url", ""),
            "doc_id": text.get("doc_id", 0),
        })

    # Build summary object
    summary = {
        "id": bill_id,
        "state": state,
        "state_name": STATE_NAMES.get(state, state),
        "bill_number": bill_number,
        "title": title,
        "summary": description,
        "status": STATUS_SIMPLIFIED.get(status_code, "unknown"),
        "status_label": STATUS_MAP.get(status_code, "Unknown"),
        "status_code": status_code,
        "categories": cat_result["categories"],
        "primary_category": cat_result["primary_category"],
        "level": determine_level(bill_data),
        "last_action_date": bill_data.get("last_action_date", ""),
        "last_action": bill_data.get("last_action", ""),
        "url": bill_data.get("url", ""),
        "legiscan_url": bill_data.get("url", ""),
        "state_url": bill_data.get("state_link", ""),
        "sponsors": sponsors,
        "introduced_date": bill_data.get("status_date", ""),
        "session": bill_data.get("session", {}).get("session_name", ""),
    }

    # Build full detail object
    detail = {
        **summary,
        "actions": actions,
        "votes": votes,
        "texts": texts,
        "committee": bill_data.get("committee", {}),
        "subjects": [s.get("subject_name", "") for s in bill_data.get("subjects", [])],
    }

    return summary, detail


def generate_state_summary(bills):
    """Generate per-state summary counts."""
    state_data = {}

    for bill in bills:
        state = bill["state"]
        if state not in state_data:
            state_data[state] = {
                "state": state,
                "state_name": STATE_NAMES.get(state, state),
                "total": 0,
                "by_category": defaultdict(int),
                "by_status": defaultdict(int),
            }

        state_data[state]["total"] += 1
        state_data[state]["by_category"][bill["primary_category"]] += 1
        state_data[state]["by_status"][bill["status"]] += 1

    # Convert defaultdicts to regular dicts for JSON serialization
    for state in state_data:
        state_data[state]["by_category"] = dict(state_data[state]["by_category"])
        state_data[state]["by_status"] = dict(state_data[state]["by_status"])

    return state_data


def generate_metadata(bills, state_data):
    """Generate metadata summary."""
    category_counts = defaultdict(int)
    status_counts = defaultdict(int)
    level_counts = defaultdict(int)

    for bill in bills:
        category_counts[bill["primary_category"]] += 1
        status_counts[bill["status"]] += 1
        level_counts[bill["level"]] += 1

    return {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_bills": len(bills),
        "total_states": len(state_data),
        "by_category": dict(category_counts),
        "by_status": dict(status_counts),
        "by_level": dict(level_counts),
    }


def save_data(all_summaries, all_details, state_data, metadata):
    """Write all JSON data files."""
    os.makedirs(BILLS_DIR, exist_ok=True)

    # Save bills.json (summary array)
    with open(BILLS_JSON, "w") as f:
        json.dump(all_summaries, f, indent=2)
    print(f"Wrote {len(all_summaries)} bills to {BILLS_JSON}")

    # Save individual bill details
    for detail in all_details:
        bill_file = os.path.join(BILLS_DIR, f"{detail['id']}.json")
        with open(bill_file, "w") as f:
            json.dump(detail, f, indent=2)
    print(f"Wrote {len(all_details)} bill detail files to {BILLS_DIR}")

    # Save states.json
    with open(STATES_JSON, "w") as f:
        json.dump(state_data, f, indent=2)
    print(f"Wrote state summary to {STATES_JSON}")

    # Save metadata.json
    with open(METADATA_JSON, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Wrote metadata to {METADATA_JSON}")


def main():
    parser = argparse.ArgumentParser(description="Anti-Trans Legislation Tracker Scraper")
    parser.add_argument("--limit", type=int, default=0,
                        help="Limit the number of bills to fetch details for (0 = no limit)")
    args = parser.parse_args()

    if not LEGISCAN_API_KEY:
        print("Error: LEGISCAN_API_KEY not set. Copy .env.example to .env and add your key.")
        sys.exit(1)

    print("=" * 60)
    print("Anti-Trans Legislation Tracker — Scraper")
    print(f"Started at {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    client = LegiScanClient()
    existing_bills = load_existing_bills()
    print(f"Loaded {len(existing_bills)} existing bills")

    # Search for bills
    print("\n--- Searching for bills ---")
    found = search_all_keywords(client)
    print(f"\nFound {len(found)} unique bills across all keywords")

    if args.limit > 0:
        found = dict(list(found.items())[:args.limit])
        print(f"Limiting to {args.limit} bills for testing")

    # Fetch details for each bill
    print("\n--- Fetching bill details ---")
    all_summaries = []
    all_details = []
    total = len(found)

    for i, (bill_id, search_info) in enumerate(found.items(), 1):
        print(f"  [{i}/{total}] Fetching bill {bill_id}...")
        bill_data = fetch_bill_details(client, bill_id, existing_bills)
        if bill_data:
            summary, detail = process_bill(bill_data, search_info)
            all_summaries.append(summary)
            all_details.append(detail)

    # Sort by last action date (most recent first)
    all_summaries.sort(key=lambda b: b.get("last_action_date", ""), reverse=True)

    # Generate aggregated data
    print("\n--- Generating summaries ---")
    state_data = generate_state_summary(all_summaries)
    metadata = generate_metadata(all_summaries, state_data)

    # Save everything
    print("\n--- Saving data ---")
    save_data(all_summaries, all_details, state_data, metadata)

    print(f"\nDone! Processed {len(all_summaries)} bills across {len(state_data)} states.")
    print(f"Finished at {datetime.now(timezone.utc).isoformat()}")


if __name__ == "__main__":
    main()
