// ============================================================
// Food Database tab
// ============================================================
let _editingFoodId = null;
let _viewMode = false;
const _foodsMap = {};

async function loadFoods() {
  const search = (document.getElementById('food-db-search')?.value || '').trim();
  try {
    const foods = await api(`/foods${search ? `?search=${encodeURIComponent(search)}` : ''}`);
    renderFoodsTable(foods);
  } catch (e) {
    showToast('Failed to load foods: ' + e.message, 'error');
  }
}

function renderFoodsTable(foods) {
  const noFoods = document.getElementById('no-foods');
  const table = document.getElementById('foods-table');
  const tbody = document.getElementById('foods-tbody');

  if (foods.length === 0) {
    noFoods.classList.remove('hidden');
    table.classList.add('hidden');
    return;
  }

  noFoods.classList.add('hidden');
  table.classList.remove('hidden');

  const fmt = (v, unit = '') => (v != null ? v + unit : '—');

  foods.forEach(f => { _foodsMap[f.id] = f; });

  tbody.innerHTML = foods.map(f => `
    <tr>
      <td>
        <strong class="food-name-link" onclick="viewFoodModal(_foodsMap[${f.id}])" style="cursor:pointer;color:var(--strava)">${escHtml(f.name)}</strong>
        ${f.brand ? `<div style="font-size:.78rem;color:var(--text-muted)">${escHtml(f.brand)}</div>` : ''}
      </td>
      <td class="mono">${fmt(f.calories)}</td>
      <td class="mono">${fmt(f.carbohydrates, 'g')}</td>
      <td class="mono">${fmt(f.sugars, 'g')}</td>
      <td class="mono">${fmt(f.proteins, 'g')}</td>
      <td class="mono">${fmt(f.fibers, 'g')}</td>
      <td class="mono">${fmt(f.fats, 'g')}</td>
      <td class="mono">${fmt(f.salt, 'g')}</td>
      <td>
        <div class="actions">
          <button class="btn btn-ghost btn-xs" onclick="openFoodModal(_foodsMap[${f.id}])">Edit</button>
          <button class="btn btn-ghost btn-xs" style="color:#ef4444" onclick="deleteFoodItem(${f.id}, '${escHtml(f.name)}')">Del</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ---- Modal ----

function viewFoodModal(food) {
  _viewMode = true;
  _editingFoodId = null;
  const title = document.getElementById('food-modal-title');
  const form = document.getElementById('food-form');

  title.textContent = food.name;
  form.reset();
  form.querySelector('[name=food_id]').value = food.id;

  const fields = ['name', 'brand', 'calories', 'carbohydrates', 'sugars', 'proteins', 'fibers', 'fats', 'saturated_fats', 'salt', 'notes'];
  fields.forEach(f => {
    const el = form.querySelector(`[name=${f}]`);
    if (el) {
      el.value = food[f] != null ? food[f] : '';
      el.disabled = true;
    }
  });

  document.getElementById('food-modal-save-btn').classList.add('hidden');
  document.getElementById('food-modal').classList.remove('hidden');
}

function openFoodModal(food = null) {
  _viewMode = false;
  _editingFoodId = food ? food.id : null;
  const title = document.getElementById('food-modal-title');
  const form = document.getElementById('food-form');

  title.textContent = food ? 'Edit Food' : 'Add Food';
  form.reset();
  form.querySelector('[name=food_id]').value = food ? food.id : '';

  const fields = ['name', 'brand', 'calories', 'carbohydrates', 'sugars', 'proteins', 'fibers', 'fats', 'saturated_fats', 'salt', 'notes'];
  fields.forEach(f => {
    const el = form.querySelector(`[name=${f}]`);
    if (el) {
      el.disabled = false;
      if (food && food[f] != null) el.value = food[f];
    }
  });

  document.getElementById('food-modal-save-btn').classList.remove('hidden');
  document.getElementById('food-modal').classList.remove('hidden');
}

function closeFoodModal(event = null) {
  if (event && event.target !== document.getElementById('food-modal')) return;
  // Re-enable all inputs in case we were in view mode
  const form = document.getElementById('food-form');
  form.querySelectorAll('input').forEach(el => el.disabled = false);
  document.getElementById('food-modal-save-btn').classList.remove('hidden');
  document.getElementById('food-modal').classList.add('hidden');
  _editingFoodId = null;
  _viewMode = false;
}

async function submitFoodForm(event) {
  event.preventDefault();
  const form = event.target;
  const data = {
    name: form.name.value.trim(),
    brand: form.brand.value.trim() || null,
    calories: parseFloat(form.calories.value),
    carbohydrates: _fv(form.carbohydrates.value),
    sugars: _fv(form.sugars.value),
    proteins: _fv(form.proteins.value),
    fibers: _fv(form.fibers.value),
    fats: _fv(form.fats.value),
    saturated_fats: _fv(form.saturated_fats.value),
    salt: _fv(form.salt.value),
    notes: form.notes.value.trim() || null,
  };

  try {
    if (_editingFoodId) {
      await api(`/foods/${_editingFoodId}`, { method: 'PUT', body: JSON.stringify(data) });
      showToast('Food updated', 'success');
    } else {
      await api('/foods', { method: 'POST', body: JSON.stringify(data) });
      showToast('Food added', 'success');
    }
    document.getElementById('food-modal').classList.add('hidden');
    loadFoods();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteFoodItem(id, name) {
  if (!confirm(`Delete "${name}"?`)) return;
  try {
    await api(`/foods/${id}`, { method: 'DELETE' });
    showToast('Food deleted', 'success');
    loadFoods();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ---- CSV ----

async function exportFoodsCSV() {
  try {
    const resp = await fetch('/foods/export-csv');
    if (!resp.ok) throw new Error('Export failed');
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'foods.csv'; a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function importFoodsCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const resp = await fetch('/foods/import-csv', { method: 'POST', body: formData });
    if (!resp.ok) throw new Error('Import failed');
    const data = await resp.json();
    showToast(`Imported ${data.imported} foods${data.errors?.length ? ` (${data.errors.length} errors)` : ''}`, 'success');
    loadFoods();
  } catch (e) {
    showToast(e.message, 'error');
  }
  event.target.value = '';
}

// ---- Utility ----
function _fv(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}
