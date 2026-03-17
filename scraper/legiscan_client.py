"""LegiScan API client with rate limiting and error handling."""

import time
import requests
from config import LEGISCAN_API_KEY, LEGISCAN_BASE_URL, API_DELAY


class LegiScanError(Exception):
    """Raised when the LegiScan API returns an error."""
    pass


class LegiScanClient:
    """Wrapper for the LegiScan REST API."""

    def __init__(self, api_key=None):
        self.api_key = api_key or LEGISCAN_API_KEY
        if not self.api_key:
            raise LegiScanError(
                "No API key provided. Set LEGISCAN_API_KEY in .env or pass it directly."
            )
        self.session = requests.Session()
        self._last_request_time = 0

    def _rate_limit(self):
        """Enforce minimum delay between requests."""
        elapsed = time.time() - self._last_request_time
        if elapsed < API_DELAY:
            time.sleep(API_DELAY - elapsed)

    def _request(self, op, **params):
        """Make a request to the LegiScan API."""
        self._rate_limit()
        params["key"] = self.api_key
        params["op"] = op

        retries = 3
        for attempt in range(retries):
            try:
                resp = self.session.get(LEGISCAN_BASE_URL, params=params, timeout=30)
                resp.raise_for_status()
                self._last_request_time = time.time()
                data = resp.json()

                if data.get("status") == "ERROR":
                    raise LegiScanError(
                        f"API error: {data.get('alert', {}).get('message', 'Unknown error')}"
                    )
                return data
            except requests.exceptions.RequestException as e:
                if attempt < retries - 1:
                    wait = 2 ** (attempt + 1)
                    print(f"  Request failed ({e}), retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    raise LegiScanError(f"Request failed after {retries} attempts: {e}")

    def search(self, query, state=None, year=2, page=1):
        """
        Search for bills by keyword using getSearch (includes title in results).

        Args:
            query: Search query string
            state: State abbreviation (e.g., "TX") or "ALL" for all states
            year: Year filter (1=current year, 2=current+last, 3=all, 4=prior)
            page: Result page number

        Returns:
            dict with 'summary' and 'results' keys
        """
        params = {"query": query, "page": page, "year": year}
        if state and state != "ALL":
            from config import STATE_IDS
            state_id = STATE_IDS.get(state)
            if state_id:
                params["state"] = state_id

        data = self._request("getSearch", **params)
        search_result = data.get("searchresult", {})

        summary = search_result.get("summary", {})

        # getSearch returns results as numbered keys alongside summary/status
        results = []
        if isinstance(search_result, dict):
            for key, val in search_result.items():
                if key not in ("summary", "status") and isinstance(val, dict):
                    results.append(val)

        return {"summary": summary, "results": results}

    def get_bill(self, bill_id):
        """
        Get full details for a specific bill.

        Args:
            bill_id: LegiScan bill ID

        Returns:
            dict with bill details
        """
        data = self._request("getBill", id=bill_id)
        return data.get("bill", {})

    def get_bill_text(self, doc_id):
        """
        Get the text of a bill document.

        Args:
            doc_id: LegiScan document ID

        Returns:
            dict with document text details
        """
        data = self._request("getBillText", id=doc_id)
        return data.get("text", {})

    def get_master_list(self, state, session_id=None):
        """
        Get a master list of all bills for a state session.

        Args:
            state: State abbreviation
            session_id: Optional specific session ID

        Returns:
            dict of bills
        """
        from config import STATE_IDS
        params = {}
        if session_id:
            params["id"] = session_id
        else:
            state_id = STATE_IDS.get(state)
            if state_id:
                params["state"] = state_id

        data = self._request("getMasterList", **params)
        return data.get("masterlist", {})
