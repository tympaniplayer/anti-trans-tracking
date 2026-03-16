"""Categorize bills by theme based on keyword matching."""

from config import CATEGORIES


def categorize_bill(title, summary="", text=""):
    """
    Categorize a bill based on its title, summary, and text.

    Returns:
        dict with 'categories' (list of matched categories) and
        'primary_category' (the strongest match)
    """
    combined = f"{title} {summary} {text}".lower()
    scores = {}

    for category, keywords in CATEGORIES.items():
        score = 0
        for keyword in keywords:
            if keyword.lower() in combined:
                score += 1
        if score > 0:
            scores[category] = score

    if not scores:
        return {"categories": ["other"], "primary_category": "other"}

    sorted_cats = sorted(scores.keys(), key=lambda c: scores[c], reverse=True)
    return {
        "categories": sorted_cats,
        "primary_category": sorted_cats[0],
    }
