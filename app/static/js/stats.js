// ============================================================
// Statistics tab
// ============================================================
async function loadStats() {
  try {
    const data = await api('/activities/stats');

    // Activities group
    document.getElementById('stat-total-activities').textContent = data.total_activities ?? '0';
    document.getElementById('stat-tracked-activities').textContent = data.tracked_activities ?? '0';
    document.getElementById('stat-total-distance').textContent =
      data.total_distance_km != null ? data.total_distance_km.toLocaleString() : '0';
    document.getElementById('stat-total-calories').textContent =
      data.total_calories_burned != null ? Math.round(data.total_calories_burned).toLocaleString() : '0';
    document.getElementById('stat-total-foods').textContent = data.total_foods ?? '0';

    // Nutrition consumed group
    document.getElementById('stat-total-kcal-consumed').textContent =
      data.total_kcal_consumed != null ? Math.round(data.total_kcal_consumed).toLocaleString() : '0';
    document.getElementById('stat-avg-kcal-consumed').textContent =
      data.avg_kcal_consumed != null ? Math.round(data.avg_kcal_consumed).toLocaleString() : '0';
    document.getElementById('stat-total-carbs').textContent =
      data.total_carbs_consumed != null ? data.total_carbs_consumed.toLocaleString() : '0';
    document.getElementById('stat-avg-carbs').textContent =
      data.avg_carbs_consumed != null ? data.avg_carbs_consumed.toLocaleString() : '0';
    document.getElementById('stat-total-sugars').textContent =
      data.total_sugars_consumed != null ? data.total_sugars_consumed.toLocaleString() : '0';
    document.getElementById('stat-avg-sugars').textContent =
      data.avg_sugars_consumed != null ? data.avg_sugars_consumed.toLocaleString() : '0';
  } catch (e) {
    showToast('Failed to load stats: ' + e.message, 'error');
  }
}
