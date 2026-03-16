/**
 * Filter module for the legislation tracker.
 */
const Filters = (() => {
  function init() {
    // Attach listeners to all filter controls
    const stateSelect = document.getElementById('filter-state');
    const sortSelect = document.getElementById('sort-select');
    const resetBtn = document.getElementById('filters-reset');
    const dateFrom = document.getElementById('filter-date-from');
    const dateTo = document.getElementById('filter-date-to');

    if (stateSelect) stateSelect.addEventListener('change', () => {
      const val = stateSelect.value;
      if (typeof MapView !== 'undefined') {
        if (val) MapView.setSelection(val);
        else MapView.clearSelection();
      }
      apply();
    });
    if (sortSelect) sortSelect.addEventListener('change', apply);
    if (resetBtn) resetBtn.addEventListener('click', reset);
    if (dateFrom) dateFrom.addEventListener('change', apply);
    if (dateTo) dateTo.addEventListener('change', apply);

    // Checkbox groups
    document.querySelectorAll('#filter-level input, #filter-category input, #filter-status input')
      .forEach(cb => cb.addEventListener('change', apply));

    // Check URL params for initial filters
    applyFromURL();
  }

  function getFilterValues() {
    const getChecked = (id) => {
      const container = document.getElementById(id);
      if (!container) return [];
      return Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
    };

    return {
      state: document.getElementById('filter-state')?.value || '',
      levels: getChecked('filter-level'),
      categories: getChecked('filter-category'),
      statuses: getChecked('filter-status'),
      dateFrom: document.getElementById('filter-date-from')?.value || '',
      dateTo: document.getElementById('filter-date-to')?.value || '',
      sort: document.getElementById('sort-select')?.value || 'date-desc',
    };
  }

  function applyToList(billsList) {
    const f = getFilterValues();
    let result = billsList;

    // State filter
    if (f.state) {
      result = result.filter(b => b.state === f.state);
    }

    // Level filter
    if (f.levels.length > 0) {
      result = result.filter(b => f.levels.includes(b.level));
    }

    // Category filter
    if (f.categories.length > 0) {
      result = result.filter(b => f.categories.includes(b.primary_category));
    }

    // Status filter
    if (f.statuses.length > 0) {
      result = result.filter(b => f.statuses.includes(b.status));
    }

    // Date range
    if (f.dateFrom) {
      result = result.filter(b => (b.last_action_date || '') >= f.dateFrom);
    }
    if (f.dateTo) {
      result = result.filter(b => (b.last_action_date || '') <= f.dateTo);
    }

    // Sort
    result = sortBills(result, f.sort);

    return result;
  }

  function apply() {
    let bills = App.getBills();

    // If there's a search query, start from search results
    if (typeof Search !== 'undefined' && Search.getQuery()) {
      Search.onSearch();
      return;
    }

    const filtered = applyToList(bills);
    App.setFilteredBills(filtered);
    updateURL();
  }

  function sortBills(bills, sortKey) {
    const sorted = [...bills];
    switch (sortKey) {
      case 'date-desc':
        sorted.sort((a, b) => (b.last_action_date || '').localeCompare(a.last_action_date || ''));
        break;
      case 'date-asc':
        sorted.sort((a, b) => (a.last_action_date || '').localeCompare(b.last_action_date || ''));
        break;
      case 'state-asc':
        sorted.sort((a, b) => (a.state_name || '').localeCompare(b.state_name || ''));
        break;
      case 'state-desc':
        sorted.sort((a, b) => (b.state_name || '').localeCompare(a.state_name || ''));
        break;
    }
    return sorted;
  }

  function reset() {
    // Reset state dropdown
    const stateSelect = document.getElementById('filter-state');
    if (stateSelect) stateSelect.value = '';

    // Check all checkboxes
    document.querySelectorAll('#filter-level input, #filter-category input, #filter-status input')
      .forEach(cb => { cb.checked = true; });

    // Clear date range
    const dateFrom = document.getElementById('filter-date-from');
    const dateTo = document.getElementById('filter-date-to');
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';

    // Reset sort
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'date-desc';

    // Clear map selection
    if (typeof MapView !== 'undefined') {
      MapView.clearSelection();
    }

    apply();
  }

  function setStateFilter(state) {
    const stateSelect = document.getElementById('filter-state');
    if (stateSelect) {
      stateSelect.value = state;
      if (typeof MapView !== 'undefined') {
        if (state) MapView.setSelection(state);
        else MapView.clearSelection();
      }
      apply();
    }
  }

  function updateURL() {
    const f = getFilterValues();
    const params = new URLSearchParams();
    if (f.state) params.set('state', f.state);
    if (f.sort !== 'date-desc') params.set('sort', f.sort);
    if (f.dateFrom) params.set('from', f.dateFrom);
    if (f.dateTo) params.set('to', f.dateTo);

    const search = typeof Search !== 'undefined' ? Search.getQuery() : '';
    if (search) params.set('q', search);

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    history.replaceState(null, '', newURL);
  }

  function applyFromURL() {
    const params = new URLSearchParams(window.location.search);

    const state = params.get('state');
    if (state) {
      const stateSelect = document.getElementById('filter-state');
      if (stateSelect) stateSelect.value = state;
    }

    const sort = params.get('sort');
    if (sort) {
      const sortSelect = document.getElementById('sort-select');
      if (sortSelect) sortSelect.value = sort;
    }

    const from = params.get('from');
    if (from) {
      const dateFrom = document.getElementById('filter-date-from');
      if (dateFrom) dateFrom.value = from;
    }

    const to = params.get('to');
    if (to) {
      const dateTo = document.getElementById('filter-date-to');
      if (dateTo) dateTo.value = to;
    }
  }

  return { init, apply, applyToList, reset, setStateFilter };
})();
