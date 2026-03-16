/**
 * Search module using Fuse.js for fuzzy search.
 */
const Search = (() => {
  let fuse = null;
  let searchInput = null;
  let clearBtn = null;

  function init(bills) {
    searchInput = document.getElementById('search-input');
    clearBtn = document.getElementById('search-clear');
    if (!searchInput) return;

    fuse = new Fuse(bills, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'summary', weight: 0.3 },
        { name: 'bill_number', weight: 0.15 },
        { name: 'state_name', weight: 0.1 },
        { name: 'sponsors', weight: 0.05 },
      ],
      threshold: 0.35,
      includeScore: true,
      ignoreLocation: true,
    });

    searchInput.addEventListener('input', onSearch);
    if (clearBtn) {
      clearBtn.addEventListener('click', clearSearch);
    }

    // Check URL params for initial search
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      searchInput.value = q;
      onSearch();
    }
  }

  function onSearch() {
    const query = searchInput.value.trim();
    if (clearBtn) clearBtn.hidden = !query;

    if (!query) {
      // No search — let filters handle it
      if (typeof Filters !== 'undefined') {
        Filters.apply();
      } else {
        App.setFilteredBills(App.getBills());
      }
      return;
    }

    const results = fuse.search(query);
    let matchedBills = results.map(r => r.item);

    // Apply current filters to search results
    if (typeof Filters !== 'undefined') {
      matchedBills = Filters.applyToList(matchedBills);
    }

    App.setFilteredBills(matchedBills);
  }

  function clearSearch() {
    searchInput.value = '';
    if (clearBtn) clearBtn.hidden = true;
    if (typeof Filters !== 'undefined') {
      Filters.apply();
    } else {
      App.setFilteredBills(App.getBills());
    }
    searchInput.focus();
  }

  function getQuery() {
    return searchInput ? searchInput.value.trim() : '';
  }

  return { init, onSearch, clearSearch, getQuery };
})();
