// ============================================================
// Settings tab
// ============================================================

const LANG_NAMES = {
  en: 'English',
  it: 'Italiano',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
};

async function loadSettings() {
  await Promise.all([loadActivityTypeFilters(), loadLanguageSelect()]);
  loadStravaHistorySection();
}

function loadStravaHistorySection() {
  const titleEl = document.getElementById('settings-strava-history-title');
  const descEl = document.getElementById('settings-strava-history-desc');
  const noteEl = document.getElementById('settings-strava-history-note');
  if (titleEl) titleEl.textContent = t('settings.strava_history.title');
  if (descEl) descEl.textContent = t('settings.strava_history.description');
  if (noteEl) noteEl.textContent = t('settings.strava_history.note');
}

async function loadLanguageSelect() {
  const select = document.getElementById('language-select');
  if (!select) return;
  try {
    const codes = await api('/locales');
    select.innerHTML = codes.map(code => {
      const name = LANG_NAMES[code] || code.toUpperCase();
      const selected = code === window._currentLang ? ' selected' : '';
      return `<option value="${code}"${selected}>${name}</option>`;
    }).join('');
  } catch {
    // non-critical: leave select empty
  }
}

async function saveLanguage(lang) {
  try {
    await api('/settings', {
      method: 'POST',
      body: JSON.stringify({ key: 'language', value: lang }),
    });
  } catch {}
  location.reload();
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
    if (container) container.innerHTML = `<p class="settings-placeholder">${t('settings.failedToLoad')}</p>`;
  }
}

function renderActivityTypeFilters(types, excluded) {
  const container = document.getElementById('activity-type-filters');
  if (!container) return;
  if (types.length === 0) {
    container.innerHTML = `<p class="settings-placeholder">${t('settings.noActivityTypes')}</p>`;
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
    showToast(t('toast.failedToSaveSetting', { msg: e.message }), 'error');
  }
}
