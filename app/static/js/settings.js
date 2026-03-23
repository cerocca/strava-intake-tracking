// ============================================================
// Settings tab
// ============================================================

async function loadSettings() {
  await loadActivityTypeFilters();
}

async function loadActivityTypeFilters() {
  const container = document.getElementById('activity-type-filters');
  if (!container) return;
  try {
    const [types, settingsData] = await Promise.all([
      api('/activities/types'),
      api('/settings'),
    ]);
    const excluded = JSON.parse(settingsData.excluded_activity_types || '[]');
    renderActivityTypeFilters(types, excluded);
  } catch (e) {
    if (container) container.innerHTML = '<p class="settings-placeholder">Failed to load activity types.</p>';
  }
}

function renderActivityTypeFilters(types, excluded) {
  const container = document.getElementById('activity-type-filters');
  if (!container) return;
  if (types.length === 0) {
    container.innerHTML = '<p class="settings-placeholder">No activity types found. Sync Strava to get started.</p>';
    return;
  }
  container.innerHTML = types.map(type => `
    <label class="type-filter-item">
      <input type="checkbox" value="${escHtml(type)}"
        ${excluded.includes(type) ? '' : 'checked'}
        onchange="saveActivityTypeFilter()" />
      <span>${escHtml(type)}</span>
    </label>
  `).join('');
}

async function saveActivityTypeFilter() {
  const container = document.getElementById('activity-type-filters');
  if (!container) return;
  const checkboxes = container.querySelectorAll('input[type="checkbox"]');
  const excluded = [];
  checkboxes.forEach(cb => { if (!cb.checked) excluded.push(cb.value); });
  try {
    await api('/settings', {
      method: 'POST',
      body: JSON.stringify({ key: 'excluded_activity_types', value: JSON.stringify(excluded) }),
    });
    if (state.currentTab === 'stats') loadStats();
    if (state.currentTab === 'graphs') loadGraphs();
  } catch (e) {
    showToast('Failed to save setting: ' + e.message, 'error');
  }
}
