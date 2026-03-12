// ============================================================
// Statistics tab
// ============================================================
async function loadStats() {
  try {
    const data = await api('/activities/stats');
    document.getElementById('stat-total-activities').textContent = data.total_activities ?? '0';
    document.getElementById('stat-tracked-activities').textContent = data.tracked_activities ?? '0';
    document.getElementById('stat-total-distance').textContent =
      data.total_distance_km != null ? data.total_distance_km.toLocaleString() : '0';
    document.getElementById('stat-total-calories').textContent =
      data.total_calories_burned != null ? Math.round(data.total_calories_burned).toLocaleString() : '0';
    document.getElementById('stat-total-foods').textContent = data.total_foods ?? '0';
  } catch (e) {
    showToast('Failed to load stats: ' + e.message, 'error');
  }
}
