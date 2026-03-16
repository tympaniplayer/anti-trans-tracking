# Anti-Trans Legislation Tracker

An automated, searchable tracker of anti-trans legislation at all levels of United States government — local, state, and federal.

## Live Site

Open `frontend/index.html` in a browser or deploy to GitHub Pages / Netlify.

## Features

- **Interactive US Map** — states colored by number of anti-trans bills
- **Full-Text Search** — search bill titles, summaries, and text with fuzzy matching
- **Filters** — by state, category, status, government level, and date range
- **Bill Details** — status timeline, sponsors, full text links, action history
- **Open Data** — all data available as JSON files for other projects to use
- **Daily Updates** — automated scraping via GitHub Actions

## Categories Tracked

| Category | Examples |
|----------|----------|
| Healthcare | Gender-affirming care bans, puberty blocker restrictions |
| Sports | Athletic participation bans based on gender identity |
| Bathrooms | Facility access restrictions |
| Education | Curriculum restrictions, pronoun policies in schools |
| Drag | Drag performance restrictions |
| Identity Documents | Birth certificate/ID gender marker restrictions |
| Religious Exemptions | Religious refusal laws targeting trans people |
| Definitions | Legal definitions of sex/gender |

## Setup

### Frontend

No build step required. Serve the `frontend/` directory with any static file server:

```bash
cd frontend
python -m http.server 8000
```

Then open http://localhost:8000

### Scraper

1. Get a free API key from [LegiScan](https://legiscan.com/legiscan)
2. Set up the scraper:

```bash
cd scraper
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your API key
python scraper.py
```

The scraper outputs JSON files to `frontend/data/`.

### GitHub Actions (Automated Daily Scraping)

1. Add your LegiScan API key as a repository secret named `LEGISCAN_API_KEY`
2. The workflow runs daily at 6:00 AM UTC and on manual trigger
3. Updated data is automatically committed to the repository

## Data Format

### `frontend/data/bills.json`

Array of bill summary objects:

```json
{
  "id": 12345,
  "state": "TX",
  "bill_number": "HB 1234",
  "title": "Relating to gender transition procedures for minors",
  "summary": "...",
  "status": "introduced",
  "status_label": "Introduced",
  "categories": ["healthcare"],
  "primary_category": "healthcare",
  "level": "state",
  "last_action_date": "2026-03-01",
  "url": "https://legiscan.com/TX/bill/HB1234/2026",
  "sponsors": ["Rep. Smith"],
  "introduced_date": "2026-01-15"
}
```

### `frontend/data/bills/{id}.json`

Full bill detail including action history and vote records.

## Data Sources

- [LegiScan API](https://legiscan.com/legiscan) — legislation data for all 50 states and Congress

## License

MIT
