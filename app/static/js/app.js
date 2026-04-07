// ============================================================
// Core state
// ============================================================
const state = {
  connected: false,
  athleteName: '',
  athletePhoto: '',
  athleteId: null,
  currentTab: 'activities',
};

// ============================================================
// API helper
// ============================================================
async function api(url, options = {}) {
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!resp.ok) {
    let detail = `HTTP ${resp.status}`;
    try { detail = (await resp.json()).detail || detail; } catch {}
    throw new Error(detail);
  }
  if (resp.status === 204) return null;
  return resp.json();
}

// ============================================================
// Tab switching
// ============================================================
function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.sidebar-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.toggle('active', section.id === `tab-${tab}`);
    section.classList.toggle('hidden', section.id !== `tab-${tab}`);
  });
  if (tab === 'stats') loadStats();
  if (tab === 'graphs') loadGraphs();
  if (tab === 'foods') loadFoods();
  if (tab === 'activities') { loadActivities(); loadSportTypes(); }
  if (tab === 'seasons') refreshSeasonsList();
  if (tab === 'settings') loadSettings();
}

// ============================================================
// Theme
// ============================================================
function applyTheme(value) {
  if (value === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else if (value === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}

function setTheme(value) {
  localStorage.setItem('theme', value);
  applyTheme(value);
}

function initTheme() {
  const saved = localStorage.getItem('theme') || 'system';
  applyTheme(saved);
  const radio = document.querySelector(`input[name="theme"][value="${saved}"]`);
  if (radio) radio.checked = true;
}

// ============================================================
// Sidebar toggle (desktop collapse)
// ============================================================
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const collapsed = sidebar.classList.toggle('sidebar--collapsed');
  localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
}

function initSidebar() {
  if (localStorage.getItem('sidebarCollapsed') === '1') {
    document.querySelector('.sidebar').classList.add('sidebar--collapsed');
  }
}

// ============================================================
// Auth
// ============================================================
function connectStrava() {
  window.location.href = '/auth/strava';
}

async function syncActivitiesFromMenu() {
  const btn = document.getElementById('user-menu-sync');
  const labelEl = document.getElementById('user-menu-sync-label');
  btn.disabled = true;
  if (labelEl) labelEl.textContent = t('nav.syncing');
  try {
    const data = await api('/auth/sync', { method: 'POST' });
    if (labelEl) labelEl.textContent = t('user_menu.sync_result', { count: data.synced });
    loadActivities(true);
    loadStats();
    setTimeout(() => {
      if (labelEl) labelEl.textContent = t('user_menu.sync_last_activities');
      btn.disabled = false;
    }, 3000);
  } catch (e) {
    showToast(e.message, 'error');
    btn.disabled = false;
    if (labelEl) labelEl.textContent = t('user_menu.sync_last_activities');
  }
}

async function disconnect() {
  try {
    await api('/auth/disconnect', { method: 'POST' });
    state.connected = false;
    state.athleteName = '';
    state.athletePhoto = '';
    state.athleteId = null;
    updateAuthUI(false, '', '', null);
    showToast(t('toast.disconnected'), 'info');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function checkAuthStatus() {
  try {
    const data = await api('/auth/status');
    state.connected = data.connected;
    state.athleteName = data.athlete_name || '';
    state.athletePhoto = data.athlete_photo || '';
    state.athleteId = data.athlete_id || null;
    updateAuthUI(data.connected, data.athlete_name || '', data.athlete_photo || '', data.athlete_id || null);
  } catch {
    updateAuthUI(false, '', '', null);
  }
}

function updateAuthUI(connected, name, photoUrl, athleteId) {
  // Dropdown: connect / disconnect buttons
  document.getElementById('user-menu-connect').classList.toggle('hidden', connected);
  document.getElementById('user-menu-disconnect').classList.toggle('hidden', !connected);
  document.getElementById('user-menu-sync').classList.toggle('hidden', !connected);
  document.getElementById('user-menu-sep-connected').classList.toggle('hidden', !connected);

  // Dropdown: profile name
  document.getElementById('user-menu-name').textContent = connected && name ? name : t('user.notConnected');

  // Dropdown: View Strava profile link
  const stravaLink = document.getElementById('user-menu-strava-link');
  if (connected && athleteId) {
    stravaLink.href = `https://www.strava.com/athletes/${athleteId}`;
    stravaLink.classList.remove('hidden');
  } else {
    stravaLink.classList.add('hidden');
  }

  // Avatar — small button icon and large in dropdown
  const avatarSmall = document.getElementById('user-avatar-small');
  const avatarLg = document.getElementById('user-menu-avatar-lg');
  if (connected && photoUrl) {
    avatarSmall.innerHTML = `<img src="${photoUrl}" class="user-avatar-img" alt="avatar" />`;
    avatarLg.innerHTML = `<img src="${photoUrl}" class="user-avatar-img user-avatar-img-lg" alt="avatar" />`;
  } else {
    const genericSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
    const genericSvgLg = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`;
    avatarSmall.innerHTML = genericSvg;
    avatarLg.innerHTML = genericSvgLg;
  }
}

// ============================================================
// Toast notifications
// ============================================================
let _toastTimer = null;

function showToast(message, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

// ============================================================
// Semver comparison (major.minor.patch integers)
// Returns true if a < b
// ============================================================
function _semverLt(a, b) {
  const parse = s => String(s).split('.').map(n => parseInt(n, 10) || 0);
  const [aMaj, aMin, aPatch] = parse(a);
  const [bMaj, bMin, bPatch] = parse(b);
  if (aMaj !== bMaj) return aMaj < bMaj;
  if (aMin !== bMin) return aMin < bMin;
  return aPatch < bPatch;
}

// ============================================================
// Version alert banner
// ============================================================
function _showVersionBanner(latestVersion, releaseUrl) {
  const banner = document.getElementById('version-alert-banner');
  if (!banner) return;
  banner.innerHTML =
    `⬆ A new version is available: <strong>v${latestVersion}</strong> — ` +
    `<a href="${releaseUrl}" target="_blank" rel="noopener">View release notes</a>` +
    `<button class="version-alert-close" onclick="this.parentElement.classList.add('hidden')" aria-label="Dismiss">×</button>`;
  banner.classList.remove('hidden');
}

// ============================================================
// Footer + version check
// ============================================================
async function initFooter() {
  let localVer = null;

  try {
    const data = await api('/version');
    localVer = data.version;
    document.getElementById('sidebar-version').textContent = `v${localVer}`;
  } catch {}

  try {
    const latestData = await api('/version/latest');
    const latestVer = latestData.latest;
    const releaseUrl = latestData.url;
    if (localVer && latestVer && releaseUrl && _semverLt(localVer, latestVer)) {
      _showVersionBanner(latestVer, releaseUrl);
    }
  } catch {}
}

// ============================================================
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initSidebar();

  // Fetch settings once for i18n language preference
  let _initSettings = {};
  try {
    _initSettings = await api('/settings');
  } catch {}
  await initI18n(_initSettings);

  await checkAuthStatus();
  // Set initial tab classes correctly
  document.querySelectorAll('.tab-content').forEach(s => {
    if (s.id !== 'tab-activities') s.classList.add('hidden');
  });
  loadActivities();
  loadSportTypes();
  refreshSeasonsList();  // populate season dropdowns in Activities, Statistics, Graphs
  initFooter();
});
