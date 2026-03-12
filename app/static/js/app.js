// ============================================================
// Core state
// ============================================================
const state = {
  connected: false,
  athleteName: '',
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
  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.toggle('active', section.id === `tab-${tab}`);
    section.classList.toggle('hidden', section.id !== `tab-${tab}`);
  });
  if (tab === 'stats') loadStats();
  if (tab === 'foods') loadFoods();
  if (tab === 'activities') loadActivities();
}

// ============================================================
// Auth
// ============================================================
function connectStrava() {
  window.location.href = '/auth/strava';
}

async function syncActivities() {
  const btn = document.getElementById('btn-sync');
  btn.disabled = true;
  btn.textContent = '↻ Syncing…';
  try {
    const data = await api('/auth/sync', { method: 'POST' });
    showToast(`Sync complete: ${data.synced} new, ${data.updated} updated`, 'success');
    loadActivities(true);
    loadStats();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '↻ Sync';
  }
}

async function disconnect() {
  try {
    await api('/auth/disconnect', { method: 'POST' });
    state.connected = false;
    updateAuthUI(false, '');
    showToast('Disconnected from Strava', 'info');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function checkAuthStatus() {
  try {
    const data = await api('/auth/status');
    state.connected = data.connected;
    state.athleteName = data.athlete_name || '';
    updateAuthUI(data.connected, data.athlete_name || '');
  } catch {
    updateAuthUI(false, '');
  }
}

function updateAuthUI(connected, name) {
  document.getElementById('btn-connect').classList.toggle('hidden', connected);
  document.getElementById('btn-sync').classList.toggle('hidden', !connected);
  document.getElementById('btn-disconnect').classList.toggle('hidden', !connected);
  const info = document.getElementById('athlete-info');
  if (connected && name) {
    info.classList.remove('hidden');
    document.getElementById('athlete-name').textContent = name;
  } else {
    info.classList.add('hidden');
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
// Init
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  // Set initial tab classes correctly
  document.querySelectorAll('.tab-content').forEach(s => {
    if (s.id !== 'tab-activities') s.classList.add('hidden');
  });
  loadActivities();
});
