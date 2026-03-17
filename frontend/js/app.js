/**
 * Main application module for the Anti-Trans Legislation Tracker.
 * Loads data and initializes components.
 */
const App = (() => {
  let bills = [];
  let metadata = {};
  let stateData = {};
  let filteredBills = [];

  const CATEGORY_LABELS = {
    healthcare: 'Healthcare',
    sports: 'Sports',
    bathrooms: 'Bathrooms',
    education: 'Education',
    drag: 'Drag',
    identity_documents: 'IDs',
    religious_exemptions: 'Religious Exemptions',
    definitions: 'Definitions',
    other: 'Other',
  };

  const SENTIMENT_LABELS = {
    restrictive: 'Restrictive',
    protective: 'Protective',
    neutral: 'Neutral',
  };

  const STATUS_LABELS = {
    introduced: 'Introduced',
    in_committee: 'In Committee',
    passed_one_chamber: 'Passed One Chamber',
    passed_both_chambers: 'Passed Both Chambers',
    signed_into_law: 'Signed into Law',
    vetoed: 'Vetoed',
    dead: 'Dead/Failed',
    draft: 'Draft',
    override: 'Override',
    unknown: 'Unknown',
  };

  async function loadJSON(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
    return resp.json();
  }

  async function init() {
    try {
      const [billsData, metaData, statesData] = await Promise.all([
        loadJSON('data/bills.json'),
        loadJSON('data/metadata.json'),
        loadJSON('data/states.json'),
      ]);

      bills = billsData;
      metadata = metaData;
      stateData = statesData;
      filteredBills = [...bills];

      updateStats();
      updateLastUpdated();
      populateStateFilter();

      // Initialize other modules if they exist
      if (typeof Search !== 'undefined') Search.init(bills);
      if (typeof MapView !== 'undefined') MapView.init(stateData);
      if (typeof Filters !== 'undefined') Filters.init();

      renderBills(filteredBills);
    } catch (err) {
      console.error('Failed to load data:', err);
      const resultsList = document.getElementById('results-list');
      if (resultsList) {
        resultsList.innerHTML = '<div class="no-results">Failed to load bill data. Please try again later.</div>';
      }
    }
  }

  function updateStats() {
    const el = (id, val) => {
      const e = document.getElementById(id);
      if (e) e.textContent = val;
    };
    el('stat-total', metadata.total_bills || bills.length);
    el('stat-states', metadata.total_states || Object.keys(stateData).length);
    el('stat-signed', (metadata.by_status || {}).signed_into_law || 0);

    const active = bills.filter(b =>
      ['introduced', 'in_committee', 'passed_one_chamber', 'passed_both_chambers'].includes(b.status)
    ).length;
    el('stat-active', active);
  }

  function updateLastUpdated() {
    const el = document.getElementById('last-updated');
    if (el && metadata.last_updated) {
      const d = new Date(metadata.last_updated);
      el.textContent = d.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    }
  }

  function populateStateFilter() {
    const select = document.getElementById('filter-state');
    if (!select) return;

    const states = [...new Set(bills.map(b => b.state))].sort();
    for (const st of states) {
      const opt = document.createElement('option');
      opt.value = st;
      const name = bills.find(b => b.state === st)?.state_name || st;
      const count = bills.filter(b => b.state === st).length;
      opt.textContent = `${name} (${count})`;
      select.appendChild(opt);
    }
  }

  function renderBills(billsList) {
    const container = document.getElementById('results-list');
    if (!container) return;

    const countEl = document.getElementById('results-count');
    if (countEl) {
      countEl.textContent = `${billsList.length} bill${billsList.length !== 1 ? 's' : ''} found`;
    }

    if (billsList.length === 0) {
      container.innerHTML = '<div class="no-results">No bills match your current filters.</div>';
      return;
    }

    container.innerHTML = billsList.map(bill => `
      <div class="bill-card" data-category="${bill.primary_category}" data-id="${bill.id}"
           onclick="App.openBill(${bill.id})">
        <div class="bill-card-header">
          <span class="bill-card-id">${escapeHTML(bill.bill_number)}</span>
          <span class="bill-card-state">${escapeHTML(bill.state_name || bill.state)}</span>
        </div>
        <div class="bill-card-title">${escapeHTML(bill.title)}</div>
        <div class="bill-card-meta">
          <span class="cat-tag cat-tag-${bill.primary_category}">
            <span class="cat-dot cat-${bill.primary_category}"></span>
            ${CATEGORY_LABELS[bill.primary_category] || bill.primary_category}
          </span>
          ${bill.sentiment ? `<span class="sentiment-badge sentiment-${bill.sentiment}">
            ${SENTIMENT_LABELS[bill.sentiment] || bill.sentiment}
          </span>` : ''}
          <span class="status-badge status-${bill.status}">
            ${STATUS_LABELS[bill.status] || bill.status}
          </span>
          <span style="color:var(--color-text-secondary)">${bill.last_action_date || ''}</span>
        </div>
      </div>
    `).join('');
  }

  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function openBill(id) {
    window.location.href = `bill.html?id=${id}`;
  }

  function setFilteredBills(newBills) {
    filteredBills = newBills;
    renderBills(filteredBills);
  }

  function getBills() { return bills; }
  function getFilteredBills() { return filteredBills; }
  function getStateData() { return stateData; }
  function getMetadata() { return metadata; }
  function getCategoryLabels() { return CATEGORY_LABELS; }
  function getStatusLabels() { return STATUS_LABELS; }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    getBills,
    getFilteredBills,
    getStateData,
    getMetadata,
    getCategoryLabels,
    getStatusLabels,
    renderBills,
    setFilteredBills,
    openBill,
    escapeHTML,
  };
})();
