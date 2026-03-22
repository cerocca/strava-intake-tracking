// ============================================================
// Seasons modal
// ============================================================

let _seasonsData = [];

async function openSeasonsModal() {
  closeUserMenu();
  document.getElementById('seasons-modal').classList.remove('hidden');
  await refreshSeasonsList();
}

function closeSeasonsModal(event) {
  if (event && event.target !== document.getElementById('seasons-modal')) return;
  _closeSeasonsModal();
}

function _closeSeasonsModal() {
  document.getElementById('seasons-modal').classList.add('hidden');
  _resetSeasonForm();
}

function _resetSeasonForm() {
  const form = document.getElementById('season-form');
  form.reset();
  document.getElementById('season-form-id').value = '';
  document.getElementById('season-form-title').textContent = 'New Season';
  document.getElementById('season-save-btn').textContent = 'Create Season';
  document.getElementById('season-error').classList.add('hidden');
  document.getElementById('season-error').textContent = '';
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
    container.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem">No seasons defined yet.</p>';
    return;
  }
  container.innerHTML = _seasonsData.map(s => `
    <div class="season-item">
      <div class="season-item-info">
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
  document.getElementById('season-type').value = s.season_type || '';
  document.getElementById('season-start').value = s.start_date;
  document.getElementById('season-end').value = s.end_date;
  document.getElementById('season-form-title').textContent = 'Edit Season';
  document.getElementById('season-save-btn').textContent = 'Save Changes';
  document.getElementById('season-error').classList.add('hidden');
  document.getElementById('season-form').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
  const payload = {
    name: document.getElementById('season-name').value.trim(),
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
    _resetSeasonForm();
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
