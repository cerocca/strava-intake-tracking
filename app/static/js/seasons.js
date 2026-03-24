// ============================================================
// Seasons tab
// ============================================================

let _seasonsData = [];
let _seasonsSortCol = null;  // null = default (year DESC from backend)
let _seasonsSortDir = 'asc';

function setSeasonsSort(col) {
  if (_seasonsSortCol === col) {
    if (_seasonsSortDir === 'asc') {
      _seasonsSortDir = 'desc';
    } else {
      _seasonsSortCol = null;
      _seasonsSortDir = 'asc';
    }
  } else {
    _seasonsSortCol = col;
    _seasonsSortDir = 'asc';
  }
  renderSeasonsList();
}

function _getSortedSeasons() {
  if (!_seasonsSortCol) return _seasonsData;
  const sorted = [..._seasonsData];
  sorted.sort((a, b) => {
    let va, vb;
    switch (_seasonsSortCol) {
      case 'year':  va = a.year ?? 0;                          vb = b.year ?? 0;                          break;
      case 'name':  va = (a.name || '').toLowerCase();         vb = (b.name || '').toLowerCase();         break;
      case 'type':  va = (a.season_type || '').toLowerCase();  vb = (b.season_type || '').toLowerCase();  break;
      case 'dates': va = a.start_date || '';                   vb = b.start_date || '';                   break;
      default:      return 0;
    }
    if (va < vb) return _seasonsSortDir === 'asc' ? -1 : 1;
    if (va > vb) return _seasonsSortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

function _sortIndicator(col) {
  if (_seasonsSortCol !== col) return '<span class="sort-indicator">↕</span>';
  return `<span class="sort-indicator active">${_seasonsSortDir === 'asc' ? '↑' : '↓'}</span>`;
}

function openSeasonsModal() {
  // Seasons are now managed in the Seasons tab (not a modal)
  switchTab('seasons');
}

function _resetSeasonForm() {
  const form = document.getElementById('season-form');
  form.reset();
  document.getElementById('season-form-id').value = '';
  document.getElementById('season-year').value = '';
  document.getElementById('season-form-title').textContent = 'New Season';
  document.getElementById('season-save-btn').textContent = 'Create Season';
  document.getElementById('season-error').classList.add('hidden');
  document.getElementById('season-error').textContent = '';
}

function openSeasonForm() {
  _resetSeasonForm();
  const section = document.getElementById('season-form-section');
  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeSeasonForm() {
  document.getElementById('season-form-section').classList.add('hidden');
  _resetSeasonForm();
}

async function refreshSeasonsList() {
  try {
    _seasonsData = await api('/seasons');
    renderSeasonsList();
    populateSeasonDropdowns(_seasonsData);
    // Refresh season stats/graphs sections after seasons change
    if (typeof loadSeasonStats === 'function') loadSeasonStats();
    if (typeof loadSeasonGraphs === 'function') loadSeasonGraphs();
  } catch (e) {
    showToast('Failed to load seasons: ' + e.message, 'error');
  }
}

function renderSeasonsList() {
  const container = document.getElementById('seasons-list');
  if (_seasonsData.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem;padding:12px 0">No seasons defined yet.</p>';
    return;
  }
  const sorted = _getSortedSeasons();
  const header = `
    <div class="seasons-sort-header">
      <div class="season-item-info">
        <button class="sort-col sort-col-year${_seasonsSortCol === 'year'  ? ' active' : ''}" onclick="setSeasonsSort('year')">Year ${_sortIndicator('year')}</button>
        <button class="sort-col sort-col-name${_seasonsSortCol === 'name'  ? ' active' : ''}" onclick="setSeasonsSort('name')">Name ${_sortIndicator('name')}</button>
        <button class="sort-col sort-col-type${_seasonsSortCol === 'type'  ? ' active' : ''}" onclick="setSeasonsSort('type')">Type ${_sortIndicator('type')}</button>
        <button class="sort-col sort-col-dates${_seasonsSortCol === 'dates' ? ' active' : ''}" onclick="setSeasonsSort('dates')">Dates ${_sortIndicator('dates')}</button>
      </div>
      <div class="season-item-actions" aria-hidden="true">
        <span class="btn btn-ghost btn-xs sort-spacer">Edit</span>
        <span class="btn btn-danger btn-xs sort-spacer">Del</span>
      </div>
    </div>
  `;
  container.innerHTML = header + sorted.map(s => `
    <div class="season-item">
      <div class="season-item-info">
        ${s.year ? `<span class="season-year-badge">${s.year}</span>` : ''}
        <strong>${escHtml(s.name)}</strong>
        ${s.season_type ? `<span class="season-type-tag">${escHtml(s.season_type)}</span>` : ''}
        <span class="season-dates">${s.start_date} → ${s.end_date}</span>
      </div>
      <div class="season-item-actions">
        <button class="btn btn-ghost btn-xs" onclick="editSeason(${s.id})">Edit</button>
        <button class="btn btn-danger btn-xs" onclick="deleteSeason(${s.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function editSeason(id) {
  const s = _seasonsData.find(x => x.id === id);
  if (!s) return;
  document.getElementById('season-form-id').value = s.id;
  document.getElementById('season-name').value = s.name;
  document.getElementById('season-year').value = s.year ?? '';
  document.getElementById('season-type').value = s.season_type || '';
  document.getElementById('season-start').value = s.start_date;
  document.getElementById('season-end').value = s.end_date;
  document.getElementById('season-form-title').textContent = 'Edit Season';
  document.getElementById('season-save-btn').textContent = 'Save Changes';
  document.getElementById('season-error').classList.add('hidden');
  const section = document.getElementById('season-form-section');
  section.classList.remove('hidden');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteSeason(id) {
  const s = _seasonsData.find(x => x.id === id);
  if (!s || !confirm(`Delete season "${s.name}"?`)) return;
  try {
    await api(`/seasons/${id}`, { method: 'DELETE' });
    showToast('Season deleted', 'success');
    await refreshSeasonsList();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
}

async function submitSeasonForm(event) {
  event.preventDefault();
  const id = document.getElementById('season-form-id').value;
  const yearVal = document.getElementById('season-year').value;
  const payload = {
    name: document.getElementById('season-name').value.trim(),
    year: yearVal ? parseInt(yearVal, 10) : null,
    season_type: document.getElementById('season-type').value.trim() || null,
    start_date: document.getElementById('season-start').value,
    end_date: document.getElementById('season-end').value,
  };

  const errorEl = document.getElementById('season-error');
  errorEl.classList.add('hidden');
  errorEl.textContent = '';

  try {
    if (id) {
      await api(`/seasons/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Season updated', 'success');
    } else {
      await api('/seasons', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Season created', 'success');
    }
    closeSeasonForm();
    await refreshSeasonsList();
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.classList.remove('hidden');
  }
}

// ---- Season dropdowns in Activities and Stats ----

function populateSeasonDropdowns(seasons) {
  const dropdowns = [
    { id: 'filter-season', defaultLabel: 'All seasons' },
    { id: 'stats-filter-season', defaultLabel: 'Select a season…' },
    { id: 'graphs-filter-season', defaultLabel: 'Select a season…' },
  ];
  dropdowns.forEach(({ id, defaultLabel }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value;
    el.innerHTML = `<option value="">${defaultLabel}</option>`;
    seasons.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name + (s.season_type ? ` (${s.season_type})` : '');
      if (String(s.id) === current) opt.selected = true;
      el.appendChild(opt);
    });
  });
}

// ---- User menu ----

function toggleUserMenu() {
  const menu = document.getElementById('user-menu-dropdown');
  menu.classList.toggle('hidden');
}

function closeUserMenu() {
  document.getElementById('user-menu-dropdown').classList.add('hidden');
}

document.addEventListener('click', e => {
  if (!e.target.closest('.user-menu-wrap')) {
    closeUserMenu();
  }
});
