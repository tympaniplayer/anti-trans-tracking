"""Configuration for the anti-trans legislation scraper."""

import os
from dotenv import load_dotenv

load_dotenv()

LEGISCAN_API_KEY = os.getenv("LEGISCAN_API_KEY", "")
LEGISCAN_BASE_URL = "https://api.legiscan.com/"

# Output paths (relative to repo root)
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "data")
BILLS_DIR = os.path.join(DATA_DIR, "bills")
BILLS_JSON = os.path.join(DATA_DIR, "bills.json")
STATES_JSON = os.path.join(DATA_DIR, "states.json")
METADATA_JSON = os.path.join(DATA_DIR, "metadata.json")

# Search keywords for finding anti-trans bills
SEARCH_KEYWORDS = [
    "transgender",
    '"gender identity"',
    '"gender transition"',
    '"biological sex"',
    '"gender affirming care"',
    '"sex change"',
    '"gender dysphoria"',
    '"sex assigned at birth"',
    '"cross-sex hormones"',
    '"puberty blockers"',
    '"gender reassignment"',
    '"change of sex"',
]

# Bill categories with their keyword patterns (matched against title + summary)
CATEGORIES = {
    "healthcare": [
        "gender affirming",
        "puberty block",
        "hormone",
        "surgery",
        "medical",
        "health care",
        "healthcare",
        "treatment",
        "prescription",
        "cross-sex",
        "gender transition procedure",
        "gender reassignment",
        "mastectomy",
        "castration",
    ],
    "sports": [
        "athlet",
        "sport",
        "team",
        "compet",
        "interscholastic",
        "intramural",
        "collegiate",
        "title ix",
    ],
    "bathrooms": [
        "bathroom",
        "restroom",
        "locker room",
        "shower",
        "facilit",
        "changing room",
        "intimate space",
    ],
    "education": [
        "school",
        "curriculum",
        "teacher",
        "classroom",
        "instruction",
        "student",
        "minor",
        "child",
        "parent",
        "guardian",
        "notification",
    ],
    "drag": [
        "drag",
        "performance",
        "adult cabaret",
        "adult entertainment",
        "male or female impersonat",
    ],
    "identity_documents": [
        "birth certificate",
        "driver license",
        "gender marker",
        "vital record",
        "identification",
        "passport",
        "sex designation",
    ],
    "religious_exemptions": [
        "religious",
        "conscience",
        "faith",
        "exemption",
        "sincerely held belief",
        "free exercise",
    ],
    "definitions": [
        "define",
        "definition",
        "biological sex",
        "male and female",
        "binary",
        "chromosom",
        "immutable",
    ],
}

# LegiScan status codes to human-readable labels
STATUS_MAP = {
    0: "N/A",
    1: "Introduced",
    2: "Engrossed",
    3: "Enrolled",
    4: "Passed",
    5: "Vetoed",
    6: "Failed",
    # Additional progress statuses
    7: "Override",
    8: "Chaptered",
    9: "Refer",
    10: "Report Pass",
    11: "Report DNP",
    12: "Draft",
}

# Simplified status for frontend display
STATUS_SIMPLIFIED = {
    0: "unknown",
    1: "introduced",
    2: "passed_one_chamber",
    3: "passed_both_chambers",
    4: "signed_into_law",
    5: "vetoed",
    6: "dead",
    7: "override",
    8: "signed_into_law",
    9: "in_committee",
    10: "in_committee",
    11: "dead",
    12: "draft",
}

# US state abbreviations to full names
STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
    "US": "Federal",
}

# LegiScan state IDs (for API queries)
STATE_IDS = {
    "AL": 1, "AK": 2, "AZ": 3, "AR": 4, "CA": 5, "CO": 6, "CT": 7, "DE": 8,
    "FL": 9, "GA": 10, "HI": 11, "ID": 12, "IL": 13, "IN": 14, "IA": 15,
    "KS": 16, "KY": 17, "LA": 18, "ME": 19, "MD": 20, "MA": 21, "MI": 22,
    "MN": 23, "MS": 24, "MO": 25, "MT": 26, "NE": 27, "NV": 28, "NH": 29,
    "NJ": 30, "NM": 31, "NY": 32, "NC": 33, "ND": 34, "OH": 35, "OK": 36,
    "OR": 37, "PA": 38, "RI": 39, "SC": 40, "SD": 41, "TN": 42, "TX": 43,
    "UT": 44, "VT": 45, "VA": 46, "WA": 47, "WV": 48, "WI": 49, "WY": 50,
    "DC": 51, "US": 52,
}

# Delay between API requests (seconds)
API_DELAY = 0.5

# Maximum number of search result pages to fetch per keyword
# getSearch returns 50 results per page
MAX_SEARCH_PAGES = 50

# Minimum relevance score (0-100) for search results to be included
MIN_RELEVANCE = 50

# Keywords that must appear in a bill's title to be considered relevant.
# Bills matching search keywords only in their full text (not title) are filtered out.
TITLE_FILTER_KEYWORDS = [
    "transgender", "gender identity", "gender expression", "gender transition",
    "gender affirming", "gender dysphoria", "gender reassign", "gender marker",
    "biological sex", "sex assigned", "sex change", "change of sex", "sex-based",
    "sex based", "sex designation", "cross-sex",
    "puberty block", "hormone",
    "nonbinary", "non-binary", "cisgender", "transsexual",
    "lgbtq", "lgbt", "sexual orientation", "sogi",
    "title ix", "birth certificate",
    "pronoun",
    "drag queen", "drag show", "adult cabaret", "male or female impersonat",
    "bathroom", "restroom", "locker room", "intimate space",
    "conversion therapy",
    "women's sport", "girls' sport", "female athlet",
    "dei", "diversity equity",
    "discrimination", "protected class", "hate crime", "civil rights",
]
