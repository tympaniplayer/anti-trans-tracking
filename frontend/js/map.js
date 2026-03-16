/**
 * Interactive US map module.
 * Colors states by bill count and handles hover/click interactions.
 */
const MapView = (() => {
  let stateData = {};
  const tooltip = document.getElementById('map-tooltip');

  // Color scale for bill counts
  const COLOR_SCALE = [
    { min: 0, max: 0, color: '#f0f0f0' },
    { min: 1, max: 2, color: '#fcbba1' },
    { min: 3, max: 5, color: '#fc9272' },
    { min: 6, max: 10, color: '#fb6a4a' },
    { min: 11, max: 20, color: '#de2d26' },
    { min: 21, max: Infinity, color: '#a50f15' },
  ];

  function getColor(count) {
    for (const level of COLOR_SCALE) {
      if (count >= level.min && count <= level.max) return level.color;
    }
    return '#f0f0f0';
  }

  async function init(data) {
    stateData = data;
    const container = document.getElementById('map-container');
    if (!container) return;

    try {
      const resp = await fetch('assets/us-map.svg');
      if (!resp.ok) throw new Error('Failed to load map');
      const svgText = await resp.text();
      container.innerHTML = svgText;

      colorizeMap();
      attachEvents();
    } catch (err) {
      console.error('Failed to load map SVG:', err);
      container.innerHTML = '<div style="text-align:center;padding:2rem;color:#999">Map could not be loaded</div>';
    }
  }

  function colorizeMap() {
    const container = document.getElementById('map-container');
    if (!container) return;

    const paths = container.querySelectorAll('svg path[id]');
    paths.forEach(path => {
      const stateAbbr = path.id;
      const data = stateData[stateAbbr];
      const count = data ? data.total : 0;
      path.style.fill = getColor(count);
    });
  }

  function attachEvents() {
    const container = document.getElementById('map-container');
    if (!container) return;

    const paths = container.querySelectorAll('svg path[id]');
    paths.forEach(path => {
      path.addEventListener('mouseenter', onMouseEnter);
      path.addEventListener('mousemove', onMouseMove);
      path.addEventListener('mouseleave', onMouseLeave);
      path.addEventListener('click', onClick);
    });
  }

  function onMouseEnter(e) {
    const stateAbbr = e.target.id;
    const data = stateData[stateAbbr];
    const name = data ? data.state_name : stateAbbr;
    const count = data ? data.total : 0;

    let html = `<strong>${name}</strong>: ${count} bill${count !== 1 ? 's' : ''}`;
    if (data && data.by_category) {
      const cats = Object.entries(data.by_category)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      if (cats.length > 0) {
        const labels = App.getCategoryLabels();
        html += '<br>' + cats.map(([cat, n]) => `${labels[cat] || cat}: ${n}`).join(', ');
      }
    }

    if (tooltip) {
      tooltip.innerHTML = html;
      tooltip.hidden = false;
    }
  }

  function onMouseMove(e) {
    if (tooltip) {
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top = (e.clientY - 10) + 'px';
    }
  }

  function onMouseLeave() {
    if (tooltip) tooltip.hidden = true;
  }

  function onClick(e) {
    const stateAbbr = e.target.id;
    if (typeof Filters !== 'undefined') {
      Filters.setStateFilter(stateAbbr);
    }
  }

  function refresh(newStateData) {
    stateData = newStateData;
    colorizeMap();
  }

  return { init, refresh, colorizeMap };
})();
