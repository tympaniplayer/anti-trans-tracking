/**
 * Bill detail page module.
 * Loads and renders individual bill details.
 */
(function () {
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

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) {
      showError('No bill ID specified.');
      return;
    }

    try {
      // Try loading individual bill detail file first
      let bill;
      try {
        const resp = await fetch(`data/bills/${id}.json`);
        if (resp.ok) {
          bill = await resp.json();
        }
      } catch (e) {
        // Fall through to bills.json
      }

      // Fallback: find bill in the main bills.json
      if (!bill) {
        const resp = await fetch('data/bills.json');
        const bills = await resp.json();
        bill = bills.find(b => String(b.id) === String(id));
      }

      if (!bill) {
        showError('Bill not found.');
        return;
      }

      render(bill);
      document.title = `${bill.bill_number} — Anti-Trans Legislation Tracker`;
    } catch (err) {
      console.error('Failed to load bill:', err);
      showError('Failed to load bill details.');
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function render(bill) {
    const container = document.getElementById('bill-detail');
    if (!container) return;

    const categoryTags = (bill.categories || [bill.primary_category]).map(cat =>
      `<span class="cat-tag cat-tag-${cat}">
        <span class="cat-dot cat-${cat}"></span>
        ${CATEGORY_LABELS[cat] || cat}
      </span>`
    ).join('');

    const statusBadge = `<span class="status-badge status-${bill.status}">
      ${STATUS_LABELS[bill.status] || bill.status}
    </span>`;

    // Sponsors
    let sponsorsHTML = '';
    if (bill.sponsors && bill.sponsors.length > 0) {
      sponsorsHTML = `
        <div class="bill-detail-section">
          <h3>Sponsors</h3>
          <ul class="sponsors-list">
            ${bill.sponsors.map(s => `<li>${escapeHTML(typeof s === 'string' ? s : s.name || '')}</li>`).join('')}
          </ul>
        </div>`;
    }

    // Actions timeline
    let actionsHTML = '';
    if (bill.actions && bill.actions.length > 0) {
      actionsHTML = `
        <div class="bill-detail-section">
          <h3>Action History</h3>
          <ul class="action-timeline">
            ${bill.actions.map(a => `
              <li>
                <span class="action-date">${escapeHTML(a.date)}</span>
                <div>${escapeHTML(a.action)}</div>
              </li>
            `).join('')}
          </ul>
        </div>`;
    }

    // Votes
    let votesHTML = '';
    if (bill.votes && bill.votes.length > 0) {
      votesHTML = `
        <div class="bill-detail-section">
          <h3>Votes</h3>
          <table class="vote-table">
            <thead><tr><th>Date</th><th>Description</th><th>Yea</th><th>Nay</th><th>Result</th></tr></thead>
            <tbody>
              ${bill.votes.map(v => `
                <tr>
                  <td>${escapeHTML(v.date)}</td>
                  <td>${escapeHTML(v.description)}</td>
                  <td>${v.yea}</td>
                  <td>${v.nay}</td>
                  <td>${v.passed ? 'Passed' : 'Failed'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;
    }

    // Subjects
    let subjectsHTML = '';
    if (bill.subjects && bill.subjects.length > 0) {
      subjectsHTML = `
        <div class="bill-detail-section">
          <h3>Subjects</h3>
          <p>${bill.subjects.map(s => escapeHTML(s)).join(', ')}</p>
        </div>`;
    }

    // External links
    let linksHTML = '<div class="bill-detail-section"><h3>Links</h3><div class="bill-links">';
    if (bill.url || bill.legiscan_url) {
      linksHTML += `<a href="${escapeHTML(bill.url || bill.legiscan_url)}" target="_blank" rel="noopener">View on LegiScan</a>`;
    }
    if (bill.state_url) {
      linksHTML += `<a href="${escapeHTML(bill.state_url)}" target="_blank" rel="noopener">View on State Legislature</a>`;
    }
    if (bill.texts && bill.texts.length > 0) {
      const latest = bill.texts[bill.texts.length - 1];
      if (latest.url) {
        linksHTML += `<a href="${escapeHTML(latest.url)}" target="_blank" rel="noopener">Read Full Text</a>`;
      }
    }
    linksHTML += '</div></div>';

    container.innerHTML = `
      <h2>${escapeHTML(bill.title)}</h2>
      <div class="bill-detail-number">
        ${escapeHTML(bill.bill_number)} — ${escapeHTML(bill.state_name || bill.state)}
        ${bill.session ? `<span style="color:var(--color-text-secondary)"> | ${escapeHTML(bill.session)}</span>` : ''}
      </div>
      <div class="bill-detail-tags">
        ${categoryTags}
        ${statusBadge}
        <span style="color:var(--color-text-secondary);font-size:0.85rem">
          Level: ${bill.level === 'federal' ? 'Federal' : 'State'}
        </span>
      </div>

      <div class="bill-detail-section">
        <h3>Summary</h3>
        <p>${escapeHTML(bill.summary) || 'No summary available.'}</p>
      </div>

      <div class="bill-detail-section">
        <h3>Latest Action</h3>
        <p><strong>${escapeHTML(bill.last_action_date)}</strong> — ${escapeHTML(bill.last_action)}</p>
      </div>

      ${sponsorsHTML}
      ${actionsHTML}
      ${votesHTML}
      ${subjectsHTML}
      ${linksHTML}
    `;
  }

  function showError(msg) {
    const container = document.getElementById('bill-detail');
    if (container) {
      container.innerHTML = `<div class="bill-loading">${escapeHTML(msg)}</div>`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
