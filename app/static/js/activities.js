// ============================================================
// Activities tab
// ============================================================
const actState = {
  items: [],
  total: 0,
  skip: 0,
  limit: 20,
  currentId: null,
  foodSearchTimer: null,
  viewMode: 'cards',    // 'cards' | 'list'
  filterSportType: '',
  filterTracked: '',
  filterSeasonId: '',
};

const SPORT_ICONS = {
  Run: '🏃', Ride: '🚴', Swim: '🏊', Walk: '🚶', Hike: '⛰️',
  WeightTraining: '🏋️', Yoga: '🧘', Workout: '💪',
  VirtualRide: '🚴', VirtualRun: '🏃', Rowing: '🚣',
  default: '🏅',
};

function sportIcon(type) {
  return SPORT_ICONS[type] || SPORT_ICONS.default;
}

function formatDuration(seconds) {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDistance(meters) {
  if (!meters) return '—';
  return (meters / 1000).toFixed(2) + ' km';
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ---- Sport type filter population ----

async function loadSportTypes() {
  try {
    const types = await api('/activities/sport_types');
    const select = document.getElementById('filter-sport-type');
    // Keep first option (All types), rebuild rest
    select.innerHTML = '<option value="">All types</option>';
    types.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      if (t === actState.filterSportType) opt.selected = true;
      select.appendChild(opt);
    });
  } catch {
    // non-critical, ignore
  }
}

// ---- Filters & view toggle ----

function applyFilters() {
  actState.filterSportType = document.getElementById('filter-sport-type').value;
  actState.filterTracked = document.getElementById('filter-tracked').value;
  actState.filterSeasonId = document.getElementById('filter-season').value;
  loadActivities(true);
}

function setViewMode(mode) {
  actState.viewMode = mode;
  document.getElementById('btn-view-cards').classList.toggle('active', mode === 'cards');
  document.getElementById('btn-view-list').classList.toggle('active', mode === 'list');
  renderActivities();
}

// ---- List view ----

async function loadActivities(reset = true) {
  if (reset) {
    actState.skip = 0;
    actState.items = [];
  }
  try {
    const params = new URLSearchParams({
      skip: actState.skip,
      limit: actState.limit,
    });
    if (actState.filterSportType) params.set('sport_type', actState.filterSportType);
    if (actState.filterTracked) params.set('tracked', actState.filterTracked);
    if (actState.filterSeasonId) params.set('season_id', actState.filterSeasonId);

    const data = await api(`/activities?${params}`);
    actState.total = data.total;
    actState.items = reset ? data.items : [...actState.items, ...data.items];
    actState.skip = actState.items.length;
    renderActivities();
  } catch (e) {
    showToast('Failed to load activities: ' + e.message, 'error');
  }
}

function renderActivities() {
  const grid = document.getElementById('activities-grid');
  const list = document.getElementById('activities-list');
  const empty = document.getElementById('no-activities');
  const counter = document.getElementById('activity-count');
  const loadMoreWrap = document.getElementById('load-more-wrap');

  const items = actState.items;
  counter.textContent = actState.total > 0 ? `${actState.total} activities` : '';

  // Always keep grid/list visibility in sync with viewMode
  if (actState.viewMode === 'list') {
    grid.classList.add('hidden');
    list.classList.remove('hidden');
  } else {
    list.classList.add('hidden');
    grid.classList.remove('hidden');
  }

  if (items.length === 0) {
    grid.innerHTML = '';
    list.innerHTML = '';
    empty.classList.remove('hidden');
    loadMoreWrap.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');

  if (actState.viewMode === 'list') {
    list.innerHTML = items.map(a => _renderListItem(a)).join('');
  } else {
    grid.innerHTML = items.map(a => _renderCard(a)).join('');
  }

  const hasMore = actState.items.length < actState.total;
  loadMoreWrap.classList.toggle('hidden', !hasMore);
}

function _renderCard(a) {
  return `
    <div class="activity-card" onclick="openActivityDetail(${a.id})">
      <div class="activity-card-header">
        <div style="display:flex;align-items:flex-start;gap:8px;flex:1">
          <span class="activity-sport-icon">${sportIcon(a.sport_type)}</span>
          <span class="activity-name">${escHtml(a.name)}</span>
        </div>
        <span class="activity-date">${formatDate(a.start_date)}</span>
      </div>
      <div class="activity-stats">
        <div class="activity-stat">
          <span class="activity-stat-value">${formatDistance(a.distance)}</span>
          <span class="activity-stat-label">Distance</span>
        </div>
        <div class="activity-stat">
          <span class="activity-stat-value">${formatDuration(a.moving_time)}</span>
          <span class="activity-stat-label">Duration</span>
        </div>
        ${a.total_elevation_gain ? `<div class="activity-stat">
          <span class="activity-stat-value">${Math.round(a.total_elevation_gain)} m</span>
          <span class="activity-stat-label">Elevation</span>
        </div>` : ''}
      </div>
      <div class="activity-badges">
        ${a.calories ? `<div class="activity-kcal-badge">⚡ ${Math.round(a.calories)} kJ</div>` : ''}
        ${a.has_nutrition ? `<div class="activity-nutrition-badge">🥗 Tracked</div>` : ''}
        ${a.season_name ? `<span class="activity-season-badge">🗓 ${escHtml(a.season_name)}</span>` : ''}
      </div>
    </div>
  `;
}

function _renderListItem(a) {
  return `
    <div class="activity-list-item" onclick="openActivityDetail(${a.id})">
      <span class="ali-icon">${sportIcon(a.sport_type)}</span>
      <div class="ali-main">
        <div class="ali-name">${escHtml(a.name)}</div>
        <div class="ali-meta">${escHtml(a.sport_type || '')}${a.sport_type && a.start_date ? ' · ' : ''}${formatDate(a.start_date)}</div>
      </div>
      <div class="ali-stats">
        ${a.distance ? `<div class="ali-stat"><span class="ali-stat-value">${formatDistance(a.distance)}</span><span class="ali-stat-label">Dist</span></div>` : ''}
        ${a.moving_time ? `<div class="ali-stat"><span class="ali-stat-value">${formatDuration(a.moving_time)}</span><span class="ali-stat-label">Time</span></div>` : ''}
        ${a.calories ? `<div class="ali-stat"><span class="ali-stat-value">${Math.round(a.calories)}</span><span class="ali-stat-label">kJ</span></div>` : ''}
      </div>
      <div class="ali-badges">
        ${a.calories ? `<div class="activity-kcal-badge">⚡ ${Math.round(a.calories)} kJ</div>` : ''}
        ${a.has_nutrition ? `<div class="activity-nutrition-badge">🥗 Tracked</div>` : ''}
        ${a.season_name ? `<span class="activity-season-badge">🗓 ${escHtml(a.season_name)}</span>` : ''}
      </div>
    </div>
  `;
}

async function loadMoreActivities() {
  await loadActivities(false);
}

// ---- Detail view ----

async function openActivityDetail(activityId) {
  actState.currentId = activityId;
  try {
    const activity = await api(`/activities/${activityId}`);
    document.getElementById('activity-list-view').classList.add('hidden');
    document.getElementById('activity-detail-view').classList.remove('hidden');
    renderActivityDetail(activity);
    await loadNutritionLog(activityId);
  } catch (e) {
    showToast('Failed to load activity: ' + e.message, 'error');
  }
}

function showActivityList() {
  document.getElementById('activity-detail-view').classList.add('hidden');
  document.getElementById('activity-list-view').classList.remove('hidden');
  actState.currentId = null;
  document.getElementById('food-search-input').value = '';
  document.getElementById('food-search-results').classList.add('hidden');
  loadActivities(true);
}

// ---- FTP helpers ----

function renderActivityDetail(a) {
  const powerSection = (a.average_watts || a.weighted_average_watts || a.max_watts || a.calories) ? `
    <div class="power-section">
      <div class="power-section-title">Power Metrics</div>
      <div class="power-stats">
        ${a.average_watts ? `<div class="power-stat">
          <div class="value">${Math.round(a.average_watts)} W</div>
          <div class="label">Avg Power</div>
        </div>` : ''}
        ${a.weighted_average_watts ? `<div class="power-stat">
          <div class="value">${Math.round(a.weighted_average_watts)} W</div>
          <div class="label">Weighted Avg</div>
        </div>` : ''}
        ${a.max_watts ? `<div class="power-stat">
          <div class="value">${Math.round(a.max_watts)} W</div>
          <div class="label">Max Power</div>
        </div>` : ''}
        ${a.calories ? `<div class="power-stat">
          <div class="value" style="color:var(--strava)">${Math.round(a.calories)}</div>
          <div class="label">Total Work (kJ)</div>
        </div>` : ''}
      </div>
    </div>
  ` : '';

  const el = document.getElementById('activity-detail-content');
  el.innerHTML = `
    <div class="activity-detail-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <span style="font-size:1.8rem">${sportIcon(a.sport_type)}</span>
        <h2 class="activity-detail-title">${escHtml(a.name)}</h2>
      </div>
      <div class="activity-detail-meta">
        ${a.sport_type || ''}${a.sport_type && a.start_date ? ' · ' : ''}${formatDate(a.start_date)}
        ${a.season ? `<span class="activity-season-badge">🗓 ${escHtml(a.season.name)}</span>` : ''}
      </div>
      <div class="activity-detail-stats">
        ${a.distance ? `<div class="activity-detail-stat"><div class="value">${formatDistance(a.distance)}</div><div class="label">Distance</div></div>` : ''}
        ${a.moving_time ? `<div class="activity-detail-stat"><div class="value">${formatDuration(a.moving_time)}</div><div class="label">Moving time</div></div>` : ''}
        ${a.elapsed_time ? `<div class="activity-detail-stat"><div class="value">${formatDuration(a.elapsed_time)}</div><div class="label">Elapsed time</div></div>` : ''}
        ${a.total_elevation_gain ? `<div class="activity-detail-stat"><div class="value">${Math.round(a.total_elevation_gain)} m</div><div class="label">Elevation</div></div>` : ''}
      </div>
      ${powerSection}
      <a class="strava-link" href="${a.strava_url}" target="_blank" rel="noopener">
        View on Strava ↗
      </a>
    </div>
  `;
}


// ---- Nutrition log ----

async function loadNutritionLog(activityId) {
  try {
    const logs = await api(`/nutrition/${activityId}`);
    renderNutritionLog(logs);
  } catch (e) {
    showToast('Failed to load nutrition log: ' + e.message, 'error');
  }
}

function renderNutritionLog(logs) {
  const summaryEl = document.getElementById('nutrition-summary');
  const listEl = document.getElementById('nutrition-log-list');

  // Group by food_id + quantity_grams
  const groupMap = {};
  for (const l of logs) {
    const key = `${l.food_id}_${l.quantity_grams}`;
    if (!groupMap[key]) {
      groupMap[key] = {
        ids: [],
        food_name: l.food_name,
        food_brand: l.food_brand,
        portion: l.quantity_grams,
        qty: 0,
        calories: 0, carbohydrates: 0, sugars: 0, proteins: 0, fats: 0,
      };
    }
    const g = groupMap[key];
    g.ids.push(l.id);
    g.qty++;
    g.calories     += l.calories     || 0;
    g.carbohydrates+= l.carbohydrates|| 0;
    g.sugars       += l.sugars       || 0;
    g.proteins     += l.proteins     || 0;
    g.fats         += l.fats         || 0;
  }
  const groups = Object.values(groupMap);

  // Totals for summary
  const totals = groups.reduce((acc, g) => {
    acc.calories      += g.calories;
    acc.carbohydrates += g.carbohydrates;
    acc.sugars        += g.sugars;
    acc.proteins      += g.proteins;
    acc.fats          += g.fats;
    return acc;
  }, { calories: 0, carbohydrates: 0, sugars: 0, proteins: 0, fats: 0 });

  summaryEl.innerHTML = logs.length === 0
    ? '<span style="color:var(--text-muted);font-size:.85rem">No foods logged yet.</span>'
    : `
      <div class="nutr-chip"><div class="nv">${totals.calories.toFixed(0)}</div><div class="nl">kcal</div></div>
      <div class="nutr-chip"><div class="nv">${totals.carbohydrates.toFixed(1)}g</div><div class="nl">Carbs</div></div>
      <div class="nutr-chip"><div class="nv">${totals.sugars.toFixed(1)}g</div><div class="nl">Sugars</div></div>
      <div class="nutr-chip"><div class="nv">${totals.proteins.toFixed(1)}g</div><div class="nl">Proteins</div></div>
      <div class="nutr-chip"><div class="nv">${totals.fats.toFixed(1)}g</div><div class="nl">Fats</div></div>
    `;

  if (logs.length === 0) {
    listEl.innerHTML = '';
    return;
  }

  listEl.innerHTML = `
    <table class="log-table">
      <thead>
        <tr>
          <th>Food</th><th>Portion</th><th>QTY</th><th>kcal</th><th>Carbs</th><th>Sugars</th><th>Prot</th><th>Fats</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${groups.map(g => `
          <tr>
            <td>
              <strong>${escHtml(g.food_name || '?')}</strong>
              ${g.food_brand ? `<br><span style="font-size:.78rem;color:var(--text-muted)">${escHtml(g.food_brand)}</span>` : ''}
            </td>
            <td class="mono">${g.portion}g</td>
            <td class="mono">${g.qty}</td>
            <td class="mono">${g.calories  ? g.calories.toFixed(1)      : '—'}</td>
            <td class="mono">${g.carbohydrates ? g.carbohydrates.toFixed(1) + 'g' : '—'}</td>
            <td class="mono">${g.sugars    ? g.sugars.toFixed(1)    + 'g' : '—'}</td>
            <td class="mono">${g.proteins  ? g.proteins.toFixed(1)  + 'g' : '—'}</td>
            <td class="mono">${g.fats      ? g.fats.toFixed(1)      + 'g' : '—'}</td>
            <td>
              <button class="btn btn-ghost btn-xs" onclick="removeNutritionLogs(${JSON.stringify(g.ids)})">✕</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function removeNutritionLogs(ids) {
  try {
    await Promise.all(ids.map(id => api(`/nutrition/${id}`, { method: 'DELETE' })));
    await loadNutritionLog(actState.currentId);
    loadStats();
    showToast('Removed', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ---- Food search for log ----
let _foodResults = [];

function searchFoodForLog() {
  clearTimeout(actState.foodSearchTimer);
  actState.foodSearchTimer = setTimeout(_doFoodSearch, 250);
}

async function _doFoodSearch() {
  const q = document.getElementById('food-search-input').value.trim();
  const dropdown = document.getElementById('food-search-results');
  try {
    const url = q ? `/foods?search=${encodeURIComponent(q)}&limit=10` : `/foods?limit=200`;
    _foodResults = await api(url);
    if (_foodResults.length === 0) {
      dropdown.innerHTML = '<div class="dropdown-item" style="color:var(--text-muted)">No results</div>';
    } else {
      dropdown.innerHTML = _foodResults.map(f => `
        <div class="dropdown-item" onclick="selectFood(${f.id})">
          <span class="di-cal">${f.calories} kcal</span>
          <div>${escHtml(f.name)}</div>
          ${f.brand ? `<div class="di-brand">${escHtml(f.brand)}</div>` : ''}
        </div>
      `).join('');
    }
    dropdown.classList.remove('hidden');
  } catch {
    dropdown.classList.add('hidden');
  }
}

function selectFood(foodId) {
  const food = _foodResults.find(f => f.id === foodId);
  if (!food) return;
  document.getElementById('food-search-input').value = food.name;
  document.getElementById('food-search-input').dataset.selectedId = foodId;
  document.getElementById('food-search-results').classList.add('hidden');

  const qtyInput = document.getElementById('food-quantity');
  const servingHint = document.getElementById('serving-hint');
  if (food.serving_grams) {
    qtyInput.value = food.serving_grams;
    servingHint.textContent = `serving: ${food.serving_grams}g`;
    servingHint.classList.remove('hidden');
  } else {
    qtyInput.value = '';
    servingHint.classList.add('hidden');
  }
  qtyInput.focus();
}

// Close dropdown when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    document.getElementById('food-search-results').classList.add('hidden');
  }
});

async function addFoodToActivity() {
  const foodId = parseInt(document.getElementById('food-search-input').dataset.selectedId);
  const qty = parseFloat(document.getElementById('food-quantity').value);
  if (!foodId) { showToast('Select a food first', 'error'); return; }
  if (!qty || qty <= 0) { showToast('Enter a valid quantity in grams', 'error'); return; }
  if (!actState.currentId) return;

  try {
    await api('/nutrition', {
      method: 'POST',
      body: JSON.stringify({ activity_id: actState.currentId, food_id: foodId, quantity_grams: qty }),
    });
    document.getElementById('food-search-input').value = '';
    document.getElementById('food-search-input').dataset.selectedId = '';
    document.getElementById('food-quantity').value = '';
    document.getElementById('serving-hint').classList.add('hidden');
    await loadNutritionLog(actState.currentId);
    loadStats();
    showToast('Food added', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ---- Utility ----
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
