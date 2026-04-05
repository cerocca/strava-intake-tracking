// ============================================================
// i18n — thin locale loader
// No framework, no build step. Exposes window.t() and window.initI18n().
// ============================================================

let _base = {};
let _overlay = {};
let _lang = 'en';

async function _loadLocale(lang) {
  const resp = await fetch(`/static/locales/${lang}.json`);
  if (!resp.ok) throw new Error(`Locale not found: ${lang}`);
  return resp.json();
}

// Translate a key with optional {var} interpolation
function t(key, vars = {}) {
  let str = (_overlay[key] !== undefined ? _overlay[key] : _base[key]);
  if (str === undefined) str = key;  // fallback: show key, never blank
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return str;
}

// Apply data-i18n / data-i18n-placeholder attributes to DOM
function _applyDataI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

// Call once at app init, before any tab renders
async function initI18n(settings = {}) {
  const saved   = (settings.language || '').trim();
  const navLang = (navigator.language || 'en').split('-')[0].toLowerCase();
  _lang = saved || navLang || 'en';

  // Always load English as the base fallback
  try {
    _base = await _loadLocale('en');
  } catch {
    _base = {};
  }

  // Overlay the chosen language on top (missing keys fall back to English)
  if (_lang !== 'en') {
    try {
      _overlay = await _loadLocale(_lang);
    } catch {
      _lang = 'en';
      _overlay = {};
    }
  } else {
    _overlay = {};
  }

  _applyDataI18n();

  // Expose current language so settings UI can pre-select it
  window._currentLang = _lang;
}

window.t = t;
window.initI18n = initI18n;
