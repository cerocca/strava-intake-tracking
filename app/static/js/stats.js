// ============================================================
// Statistics tab
// ============================================================

async function loadStats() {
  await Promise.all([loadTotalStats(), loadSeasonStats()]);
}

async function loadTotalStats() {
  try {
    const data = await api('/activities/stats');

    document.getElementById('stat-total-activities').textContent = data.total_activities ?? '0';
    document.getElementById('stat-tracked-activities').textContent = data.tracked_activities ?? '0';
    document.getElementById('stat-total-distance').textContent =
      data.total_distance_km != null ? data.total_distance_km.toLocaleString() : '0';
    document.getElementById('stat-total-calories').textContent =
      data.total_calories_burned != null ? Math.round(data.total_calories_burned).toLocaleString() : '0';
    document.getElementById('stat-total-foods').textContent = data.total_foods ?? '0';

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

async function loadSeasonStats() {
  const emptyEl = document.getElementById('season-stats-empty');
  const contentEl = document.getElementById('season-stats-content');

  // Check if any seasons exist
  if (typeof _seasonsData !== 'undefined' && _seasonsData.length === 0) {
    emptyEl.textContent = 'No seasons defined yet. Create one from the user menu.';
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    return;
  }

  const seasonId = document.getElementById('stats-filter-season')?.value;
  if (!seasonId) {
    emptyEl.textContent = 'Select a season to view filtered stats.';
    emptyEl.classList.remove('hidden');
    contentEl.classList.add('hidden');
    return;
  }

  emptyEl.classList.add('hidden');

  try {
    const data = await api(`/activities/stats?season_id=${seasonId}`);
    contentEl.classList.remove('hidden');

    document.getElementById('season-stat-total-activities').textContent = data.total_activities ?? '0';
    document.getElementById('season-stat-tracked-activities').textContent = data.tracked_activities ?? '0';
    document.getElementById('season-stat-total-distance').textContent =
      data.total_distance_km != null ? data.total_distance_km.toLocaleString() : '0';
    document.getElementById('season-stat-total-calories').textContent =
      data.total_calories_burned != null ? Math.round(data.total_calories_burned).toLocaleString() : '0';

    document.getElementById('season-stat-total-kcal-consumed').textContent =
      data.total_kcal_consumed != null ? Math.round(data.total_kcal_consumed).toLocaleString() : '0';
    document.getElementById('season-stat-avg-kcal-consumed').textContent =
      data.avg_kcal_consumed != null ? Math.round(data.avg_kcal_consumed).toLocaleString() : '0';
    document.getElementById('season-stat-total-carbs').textContent =
      data.total_carbs_consumed != null ? data.total_carbs_consumed.toLocaleString() : '0';
    document.getElementById('season-stat-avg-carbs').textContent =
      data.avg_carbs_consumed != null ? data.avg_carbs_consumed.toLocaleString() : '0';
    document.getElementById('season-stat-total-sugars').textContent =
      data.total_sugars_consumed != null ? data.total_sugars_consumed.toLocaleString() : '0';
    document.getElementById('season-stat-avg-sugars').textContent =
      data.avg_sugars_consumed != null ? data.avg_sugars_consumed.toLocaleString() : '0';
  } catch (e) {
    showToast('Failed to load season stats: ' + e.message, 'error');
  }
}
