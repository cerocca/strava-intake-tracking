// ============================================================
// Food Database tab
// ============================================================
let _editingFoodId = null;
let _viewMode = false;
let _offCurrentCode = null;
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
        <strong class="food-name-link" onclick="viewFoodModal(_foodsMap[${f.id}])" style="cursor:pointer;color:var(--strava)">${escHtml(f.name)}</strong>${f.off_id ? ` <a class="off-link" href="https://world.openfoodfacts.org/product/${encodeURIComponent(f.off_id)}" target="_blank" rel="noopener" title="View on OpenFoodFacts">O.F.Facts ↗</a>` : ''}
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

// ---- OpenFoodFacts search ----

async function searchOFF() {
  const name    = document.getElementById('off-name-input').value.trim();
  const barcode = document.getElementById('off-barcode-input').value.trim();
  const resultsEl = document.getElementById('off-results');

  if (!name && !barcode) {
    showToast('Enter a name or barcode', 'error');
    return;
  }

  resultsEl.innerHTML = '<div class="off-loading">Searching…</div>';
  resultsEl.classList.remove('hidden');

  try {
    let products = [];
    if (barcode) {
      const resp = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`);
      const data = await resp.json();
      if (data.status === 1 && data.product) products = [data.product];
    } else {
      const resp = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&json=1&page_size=10`);
      const data = await resp.json();
      products = (data.products || []).filter(p => p.product_name);
    }

    if (products.length === 0) {
      resultsEl.innerHTML = '<div class="off-no-results">No results found.</div>';
      return;
    }

    resultsEl.innerHTML = products.map((p, i) => {
      const pname = p.product_name || p.product_name_it || '—';
      const brand = p.brands || '';
      const kcal  = p.nutriments?.['energy-kcal_100g'] ?? p.nutriments?.['energy-kcal'] ?? null;
      return `
        <div class="off-result-item" onclick="_fillFromOFF(${i})">
          <div class="off-result-name">${escHtml(pname)}</div>
          ${brand ? `<div class="off-result-brand">${escHtml(brand)}</div>` : ''}
          ${kcal != null ? `<div class="off-result-kcal">${Math.round(kcal)} kcal/100g</div>` : ''}
        </div>`;
    }).join('');

    // Store results for click handler
    window._offProducts = products;

  } catch (e) {
    resultsEl.innerHTML = '<div class="off-no-results">Network error. Please try again.</div>';
  }
}

function _fillFromOFF(index) {
  const p = window._offProducts[index];
  if (!p) return;

  const n = p.nutriments || {};
  const _v = key => {
    const val = n[key];
    return (val != null && val !== '') ? parseFloat(val) : null;
  };

  const form = document.getElementById('food-form');
  const set = (name, val) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el && val != null) el.value = val;
  };

  set('name',           p.product_name || p.product_name_it || '');
  set('brand',          p.brands || '');
  set('calories',       _v('energy-kcal_100g') ?? _v('energy-kcal'));
  set('carbohydrates',  _v('carbohydrates_100g'));
  set('sugars',         _v('sugars_100g'));
  set('proteins',       _v('proteins_100g'));
  set('fats',           _v('fat_100g'));
  set('saturated_fats', _v('saturated-fat_100g'));
  set('salt',           _v('salt_100g'));
  set('fibers',         _v('fiber_100g'));

  // Serving size from OFF: try serving_quantity (numeric g) first, then parse serving_size string
  const servingQty = parseFloat(p.serving_quantity);
  if (!isNaN(servingQty) && servingQty > 0) {
    set('serving_grams', servingQty);
  } else if (p.serving_size) {
    const match = String(p.serving_size).match(/(\d+(?:[.,]\d+)?)\s*g/i);
    if (match) set('serving_grams', parseFloat(match[1].replace(',', '.')));
  }

  _offCurrentCode = p.code || p.id || null;

  document.getElementById('off-results').classList.add('hidden');
  document.getElementById('off-name-input').value = '';
  document.getElementById('off-barcode-input').value = '';
}

// ---- Modal ----

function _resetOFFSearch() {
  document.getElementById('off-name-input').value = '';
  document.getElementById('off-barcode-input').value = '';
  document.getElementById('off-results').classList.add('hidden');
  window._offProducts = [];
  _offCurrentCode = null;
}

function viewFoodModal(food) {
  _viewMode = true;
  _editingFoodId = null;
  document.getElementById('off-search-section').classList.add('hidden');
  const title = document.getElementById('food-modal-title');
  const form = document.getElementById('food-form');

  title.innerHTML = escHtml(food.name) + (food.off_id
    ? ` <a class="off-link off-link-modal" href="https://world.openfoodfacts.org/product/${encodeURIComponent(food.off_id)}" target="_blank" rel="noopener" title="View on OpenFoodFacts">O.F.Facts ↗</a>`
    : '');
  form.reset();
  form.querySelector('[name=food_id]').value = food.id;

  const fields = ['name', 'brand', 'calories', 'carbohydrates', 'sugars', 'proteins', 'fibers', 'fats', 'saturated_fats', 'salt', 'serving_grams', 'notes'];
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
  _offCurrentCode = food ? (food.off_id || null) : null;
  // Show OFF search only when adding a new food
  const offSection = document.getElementById('off-search-section');
  if (food) {
    offSection.classList.add('hidden');
  } else {
    _resetOFFSearch();
    offSection.classList.remove('hidden');
  }
  const title = document.getElementById('food-modal-title');
  const form = document.getElementById('food-form');

  title.textContent = food ? 'Edit Food' : 'Add Food';
  form.reset();
  form.querySelector('[name=food_id]').value = food ? food.id : '';

  const fields = ['name', 'brand', 'calories', 'carbohydrates', 'sugars', 'proteins', 'fibers', 'fats', 'saturated_fats', 'salt', 'serving_grams', 'notes'];
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
  _resetOFFSearch();
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
    serving_grams: _fv(form.serving_grams.value),
    notes: form.notes.value.trim() || null,
    off_id: _offCurrentCode || null,
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
