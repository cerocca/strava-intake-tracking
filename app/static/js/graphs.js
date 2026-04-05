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

function _fmtSeasonDate(iso) {
  if (!iso) return '?';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
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
  await loadNutritionCharts('total', null);
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
    ['chart-scatter-kcal-season', 'chart-scatter-carbs-season', 'chart-kcal-ratio-season',
     'chart-macros-donut-season', 'chart-kcal-sport-season'].forEach(id => _destroyChart(id));
    return;
  }

  emptyEl.classList.add('hidden');
  contentEl.classList.remove('hidden');

  // Look up full season object for label updates
  const season = (typeof _seasonsData !== 'undefined' && _seasonsData)
    ? _seasonsData.find(s => String(s.id) === String(seasonId)) ?? null
    : null;

  // Update Activities & Distance title and date subtitle
  if (season) {
    const actTitleEl = document.getElementById('season-activity-distance-title');
    const actSubtitleEl = document.getElementById('season-activity-date-subtitle');
    if (actTitleEl) actTitleEl.textContent = `Activities \u0026 Distance \u2014 ${season.name}`;
    if (actSubtitleEl) actSubtitleEl.textContent =
      `${_fmtSeasonDate(season.start_date)} \u2192 ${_fmtSeasonDate(season.end_date)}`;
  }

  try {
    const data = await api(`/activities/graphs?season_id=${seasonId}`);
    _renderGraphs(data, 'season');
  } catch (e) {
    showToast('Failed to load season graphs: ' + e.message, 'error');
  }
  await loadNutritionCharts('season', season ?? { id: seasonId });
}

async function loadNutritionCharts(scope, seasonData = null) {
  const emptyEl  = document.getElementById(`nutrition-charts-empty-${scope}`);
  const contentEl = document.getElementById(`nutrition-charts-content-${scope}`);

  const url = seasonData?.id
    ? `/activities/graphs/nutrition?season_id=${seasonData.id}`
    : '/activities/graphs/nutrition';

  // Update season section labels when a named season is available
  if (scope === 'season' && seasonData?.name) {
    const titleEl = document.getElementById('season-nutrition-charts-title');
    const subtitleEl = document.getElementById('season-nutrition-charts-subtitle');
    if (titleEl) titleEl.textContent = `Nutrition Charts \u2014 ${seasonData.name}`;
    if (subtitleEl) subtitleEl.textContent =
      `${_fmtSeasonDate(seasonData.start_date)} \u2192 ${_fmtSeasonDate(seasonData.end_date)}`;
  }

  let data;
  try {
    data = await api(url);
  } catch (e) {
    showToast('Failed to load nutrition charts: ' + e.message, 'error');
    return;
  }

  const ids = {
    scatterKcal: `chart-scatter-kcal-${scope}`,
    scatterCarbs: `chart-scatter-carbs-${scope}`,
    kcalRatio:   `chart-kcal-ratio-${scope}`,
    macrosDonut: `chart-macros-donut-${scope}`,
    kcalSport:   `chart-kcal-sport-${scope}`,
  };

  Object.values(ids).forEach(id => _destroyChart(id));

  if (data.length === 0) {
    if (emptyEl) { emptyEl.textContent = 'No tracked activities yet.'; emptyEl.classList.remove('hidden'); }
    contentEl?.classList.add('hidden');
    return;
  }

  emptyEl?.classList.add('hidden');
  contentEl?.classList.remove('hidden');

  // Chart 1 — Kcal consumed vs kJ produced (scatter)
  const ctxScatterKcal = document.getElementById(ids.scatterKcal)?.getContext('2d');
  if (ctxScatterKcal) {
    _charts[ids.scatterKcal] = new Chart(ctxScatterKcal, {
      type: 'scatter',
      data: {
        datasets: [{
          data: data.map(a => ({ x: a.kilojoules, y: a.kcal_consumed, name: a.name })),
          backgroundColor: CHART_DEFAULTS.color,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.raw.name}: ${ctx.raw.x} kJ / ${ctx.raw.y} kcal`,
            },
            bodyFont: { family: CHART_DEFAULTS.monoFont },
            titleFont: { family: CHART_DEFAULTS.font },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'kJ produced', color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.font, size: 11 } },
            ticks: { color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.monoFont, size: 11 } },
            grid: { color: CHART_DEFAULTS.gridColor },
          },
          y: {
            title: { display: true, text: 'kcal consumed', color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.font, size: 11 } },
            beginAtZero: true,
            ticks: { color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.monoFont, size: 11 } },
            grid: { color: CHART_DEFAULTS.gridColor },
          },
        },
      },
    });
  }

  // Chart 2 — Carbs consumed vs duration (scatter)
  const ctxScatterCarbs = document.getElementById(ids.scatterCarbs)?.getContext('2d');
  if (ctxScatterCarbs) {
    _charts[ids.scatterCarbs] = new Chart(ctxScatterCarbs, {
      type: 'scatter',
      data: {
        datasets: [{
          data: data.map(a => ({ x: +(a.duration_seconds / 60).toFixed(1), y: a.carbs_grams, name: a.name })),
          backgroundColor: CHART_DEFAULTS.color,
          pointRadius: 5,
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.raw.name}: ${ctx.raw.x} min / ${ctx.raw.y} g`,
            },
            bodyFont: { family: CHART_DEFAULTS.monoFont },
            titleFont: { family: CHART_DEFAULTS.font },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Duration (min)', color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.font, size: 11 } },
            ticks: { color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.monoFont, size: 11 } },
            grid: { color: CHART_DEFAULTS.gridColor },
          },
          y: {
            title: { display: true, text: 'Carbs (g)', color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.font, size: 11 } },
            beginAtZero: true,
            ticks: { color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.monoFont, size: 11 } },
            grid: { color: CHART_DEFAULTS.gridColor },
          },
        },
      },
    });
  }

  // Chart 3 — Kcal ratio consumed / burned (bar)
  const ratioData = data
    .filter(a => a.kilojoules > 0)
    .map(a => ({ name: a.name, ratio: +(a.kcal_consumed / (a.kilojoules * 0.239006)).toFixed(2) }));

  const ctxRatio = document.getElementById(ids.kcalRatio)?.getContext('2d');
  if (ctxRatio && ratioData.length > 0) {
    _charts[ids.kcalRatio] = new Chart(ctxRatio, {
      type: 'bar',
      data: {
        labels: ratioData.map(d => d.name.length > 20 ? d.name.slice(0, 20) + '\u2026' : d.name),
        datasets: [{
          data: ratioData.map(d => d.ratio),
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
              title: items => ratioData[items[0].dataIndex].name,
              label: ctx => `Ratio: ${ctx.parsed.y}`,
            },
            bodyFont: { family: CHART_DEFAULTS.monoFont },
            titleFont: { family: CHART_DEFAULTS.font },
          },
        },
        scales: {
          x: {
            ticks: { color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.font, size: 11 }, maxRotation: 45 },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.monoFont, size: 11 } },
            grid: { color: CHART_DEFAULTS.gridColor },
          },
        },
      },
    });
  }

  // Chart 4 — Macros distribution (doughnut)
  const totalCarbs   = data.reduce((s, a) => s + a.carbs_grams, 0);
  const totalProtein = data.reduce((s, a) => s + a.protein_grams, 0);
  const totalFat     = data.reduce((s, a) => s + a.fat_grams, 0);
  const totalSugar   = data.reduce((s, a) => s + a.sugar_grams, 0);
  const macroTotal   = totalCarbs + totalProtein + totalFat + totalSugar;

  const ctxDonut = document.getElementById(ids.macrosDonut)?.getContext('2d');
  if (ctxDonut) {
    _charts[ids.macrosDonut] = new Chart(ctxDonut, {
      type: 'doughnut',
      data: {
        labels: ['Carbs', 'Proteins', 'Fats', 'Sugars'],
        datasets: [{
          data: [totalCarbs, totalProtein, totalFat, totalSugar],
          backgroundColor: ['#FC4C02', '#3b82f6', '#10b981', '#f59e0b'],
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { font: { family: CHART_DEFAULTS.font }, color: CHART_DEFAULTS.tickColor },
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const val = ctx.parsed;
                const pct = macroTotal > 0 ? ((val / macroTotal) * 100).toFixed(1) : '0.0';
                return `${ctx.label}: ${val.toFixed(1)} g (${pct}%)`;
              },
            },
            bodyFont: { family: CHART_DEFAULTS.monoFont },
          },
        },
      },
    });
  }

  // Chart 5 — Kcal consumed by sport type (bar)
  const bySport = {};
  data.forEach(a => {
    const t = a.sport_type || 'Unknown';
    bySport[t] = (bySport[t] || 0) + a.kcal_consumed;
  });
  const sportLabels = Object.keys(bySport);
  const sportValues = sportLabels.map(t => +bySport[t].toFixed(0));

  const ctxSport = document.getElementById(ids.kcalSport)?.getContext('2d');
  if (ctxSport) {
    _charts[ids.kcalSport] = new Chart(ctxSport, {
      type: 'bar',
      data: {
        labels: sportLabels,
        datasets: [{
          data: sportValues,
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
              label: ctx => `${ctx.parsed.y} kcal`,
            },
            bodyFont: { family: CHART_DEFAULTS.monoFont },
            titleFont: { family: CHART_DEFAULTS.font },
          },
        },
        scales: {
          x: {
            ticks: { color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.font, size: 11 } },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: CHART_DEFAULTS.tickColor, font: { family: CHART_DEFAULTS.monoFont, size: 11 }, precision: 0 },
            grid: { color: CHART_DEFAULTS.gridColor },
          },
        },
      },
    });
  }
}

async function loadGraphs() {
  await Promise.all([loadTotalGraphs(), loadSeasonGraphs()]);
}
