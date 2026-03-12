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

// ---- List view ----

async function loadActivities(reset = true) {
  if (reset) {
    actState.skip = 0;
    actState.items = [];
  }
  try {
    const data = await api(`/activities?skip=${actState.skip}&limit=${actState.limit}`);
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
  const empty = document.getElementById('no-activities');
  const counter = document.getElementById('activity-count');
  const loadMoreWrap = document.getElementById('load-more-wrap');

  const items = actState.items;
  counter.textContent = actState.total > 0 ? `${actState.total} activities` : '';

  if (items.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    loadMoreWrap.classList.add('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = items.map(a => `
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
      </div>
    </div>
  `).join('');

  const hasMore = actState.items.length < actState.total;
  loadMoreWrap.classList.toggle('hidden', !hasMore);
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

function renderActivityDetail(a) {
  const el = document.getElementById('activity-detail-content');
  el.innerHTML = `
    <div class="activity-detail-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <span style="font-size:1.8rem">${sportIcon(a.sport_type)}</span>
        <h2 class="activity-detail-title">${escHtml(a.name)}</h2>
      </div>
      <div class="activity-detail-meta">
        ${a.sport_type || ''}${a.sport_type && a.start_date ? ' · ' : ''}${formatDate(a.start_date)}
      </div>
      <div class="activity-detail-stats">
        ${a.distance ? `<div class="activity-detail-stat"><div class="value">${formatDistance(a.distance)}</div><div class="label">Distance</div></div>` : ''}
        ${a.moving_time ? `<div class="activity-detail-stat"><div class="value">${formatDuration(a.moving_time)}</div><div class="label">Moving time</div></div>` : ''}
        ${a.elapsed_time ? `<div class="activity-detail-stat"><div class="value">${formatDuration(a.elapsed_time)}</div><div class="label">Elapsed time</div></div>` : ''}
        ${a.total_elevation_gain ? `<div class="activity-detail-stat"><div class="value">${Math.round(a.total_elevation_gain)} m</div><div class="label">Elevation</div></div>` : ''}
        ${a.calories ? `<div class="activity-detail-stat"><div class="value" style="color:var(--strava)">${Math.round(a.calories)}</div><div class="label">Total Work (kJ)</div></div>` : ''}
      </div>
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

  // Totals
  const totals = logs.reduce((acc, l) => {
    acc.calories += l.calories || 0;
    acc.carbohydrates += l.carbohydrates || 0;
    acc.proteins += l.proteins || 0;
    acc.fats += l.fats || 0;
    return acc;
  }, { calories: 0, carbohydrates: 0, proteins: 0, fats: 0 });

  summaryEl.innerHTML = logs.length === 0
    ? '<span style="color:var(--text-muted);font-size:.85rem">No foods logged yet.</span>'
    : `
      <div class="nutr-chip"><div class="nv">${totals.calories.toFixed(0)}</div><div class="nl">kcal</div></div>
      <div class="nutr-chip"><div class="nv">${totals.carbohydrates.toFixed(1)}g</div><div class="nl">Carbs</div></div>
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
          <th>Food</th><th>Qty</th><th>kcal</th><th>Carbs</th><th>Prot</th><th>Fats</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(l => `
          <tr>
            <td>
              <strong>${escHtml(l.food_name || '?')}</strong>
              ${l.food_brand ? `<br><span style="font-size:.78rem;color:var(--text-muted)">${escHtml(l.food_brand)}</span>` : ''}
            </td>
            <td class="mono">${l.quantity_grams}g</td>
            <td class="mono">${l.calories != null ? l.calories : '—'}</td>
            <td class="mono">${l.carbohydrates != null ? l.carbohydrates + 'g' : '—'}</td>
            <td class="mono">${l.proteins != null ? l.proteins + 'g' : '—'}</td>
            <td class="mono">${l.fats != null ? l.fats + 'g' : '—'}</td>
            <td>
              <button class="btn btn-ghost btn-xs" onclick="removeNutritionLog(${l.id})">✕</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function removeNutritionLog(logId) {
  try {
    await api(`/nutrition/${logId}`, { method: 'DELETE' });
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
  if (!q) { dropdown.classList.add('hidden'); return; }
  try {
    _foodResults = await api(`/foods?search=${encodeURIComponent(q)}&limit=10`);
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
  document.getElementById('food-quantity').focus();
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
