// ============================================================
// Graphs tab — Chart.js
// ============================================================

const _charts = {};

const CHART_DEFAULTS = {
  color: '#FC4C02',
  colorAlpha: 'rgba(252,76,2,0.15)',
  font: "'DM Sans', system-ui, sans-serif",
  monoFont: "'DM Mono', monospace",
  gridColor: 'rgba(0,0,0,0.06)',
  tickColor: '#9ca3af',
};

function _destroyChart(id) {
  if (_charts[id]) {
    _charts[id].destroy();
    delete _charts[id];
  }
}

function _formatMonth(ym) {
  const [year, month] = ym.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function _buildBarChart(canvasId, labels, values, yLabel) {
  _destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  _charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: CHART_DEFAULTS.color,
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y} ${yLabel}`,
          },
          bodyFont: { family: CHART_DEFAULTS.monoFont },
          titleFont: { family: CHART_DEFAULTS.font },
        },
      },
      scales: {
        x: {
          ticks: {
            color: CHART_DEFAULTS.tickColor,
            font: { family: CHART_DEFAULTS.font, size: 11 },
            maxRotation: 45,
          },
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: CHART_DEFAULTS.tickColor,
            font: { family: CHART_DEFAULTS.monoFont, size: 11 },
            precision: 0,
          },
          grid: { color: CHART_DEFAULTS.gridColor },
        },
      },
    },
  });
}

function _renderGraphs(data, prefix) {
  // For total graphs cap at last 12 months
  const slice = prefix === 'total' ? data.slice(-12) : data;
  const labels = slice.map(d => _formatMonth(d.month));
  const counts = slice.map(d => d.activity_count);
  const distances = slice.map(d => d.total_distance_km);
  _buildBarChart(`chart-${prefix}-activities`, labels, counts, 'activities');
  _buildBarChart(`chart-${prefix}-distance`, labels, distances, 'km');
}

async function loadTotalGraphs() {
  try {
    const data = await api('/activities/graphs');
    _renderGraphs(data, 'total');
  } catch (e) {
    showToast('Failed to load graphs: ' + e.message, 'error');
  }
}

async function loadSeasonGraphs() {
  const emptyEl = document.getElementById('season-graphs-empty');
  const contentEl = document.getElementById('season-graphs-content');

  if (typeof _seasonsData !== 'undefined' && _seasonsData.length === 0) {
    emptyEl.textContent = 'No seasons defined yet. Create one in the Seasons section.';
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    return;
  }

  const seasonId = document.getElementById('graphs-filter-season')?.value;
  if (!seasonId) {
    emptyEl.textContent = 'Select a season to view filtered graphs.';
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    _destroyChart('chart-season-activities');
    _destroyChart('chart-season-distance');
    return;
  }

  emptyEl.classList.add('hidden');
  contentEl.classList.remove('hidden');

  try {
    const data = await api(`/activities/graphs?season_id=${seasonId}`);
    _renderGraphs(data, 'season');
  } catch (e) {
    showToast('Failed to load season graphs: ' + e.message, 'error');
  }
}

async function loadGraphs() {
  await Promise.all([loadTotalGraphs(), loadSeasonGraphs()]);
}
