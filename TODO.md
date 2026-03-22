# TODO

## 🔄 Ongoing

---

## 🗺 Roadmap / Future ideas

- [ ] **Graphs tab** *(not yet implemented — current tab is a placeholder)*: charts based on **tracked activities only** (with food log); implementation via **Chart.js** (vanilla JS, no additional dependencies); planned charts:
  - Kcal consumed vs kJ produced (scatter plot)
  - Carbs consumed vs activity duration
  - Kcal ratio consumed/burned per activity
  - Monthly trends: kcal, carbs, tracked vs total activities (bar charts)
  - Macros distribution (donut chart: carbs / proteins / fats / sugars)
  - Kcal by sport type (grouped bar chart)
- [ ] **Fix footer and user menu** — footer sizing and layout refinements; user menu: fix "Seasons ⚙" icon position (gear icon after text, not before), Language/Seasons alignment, separator weight between Disconnect and Language
- [ ] **Dynamic version alert** — notify user when local version is behind latest GitHub release
- [ ] **Language support** — additional languages beyond English placeholder
- [ ] **OpenFoodFacts link** — link to product page on imported foods
- [ ] **Lateral menu UI** — replace tab navigation with a lateral sidebar menu
- [ ] Sync all Strava activities (currently limited to last 100)
- [ ] Night / day theme
- [ ] Foods added in local DB may go on OpenFoodFacts

---

## ✅ Completed

### v0.3
- [x] Season tracking: define seasons (name, type, date range); filter activities and statistics by season; season badge on activity detail page
- [x] User menu: avatar dropdown with Strava profile info, Connect/Disconnect, Language selector, Seasons management
- [x] Statistics split into Total Stats (all-time) and Season Stats (per-season filter)
- [x] Graphs tab placeholder added (Chart.js loaded, tab structure in place)
- [x] Dynamic footer: local version + latest GitHub release + "Powered by Strava" + GitHub link
- [x] UI language standardised to English
- [x] Credits / GitHub repo link in the app (footer + user menu)
- [x] `APP_VERSION` constant in config.py; `GET /version` endpoint
- [x] `GET /auth/status` returns `athlete_photo` and `athlete_id`

### v0.2
- [x] List and card view for activities (toggle)
- [x] Flag "tracked" activities with food log
- [x] Filter activities by sport type
- [x] Filter activities by tracked / untracked
- [x] Improved Statistics tab: total and average kcal, sugars and carbs (tracked activities only)
- [x] Full OpenFoodFacts integration: search by name / barcode, import with form pre-fill
- [x] Portion weight field (serving_grams) in food database, auto-filled when logging food to activity

### v0.1
- [x] FastAPI + SQLite + Docker setup
- [x] Strava OAuth2 + token refresh
- [x] Activity sync with kcal from kilojoules
- [x] Activity detail view
- [x] Food database CRUD with fibers
- [x] CSV import / export
- [x] Food logging per activity with quantities
- [x] Total kcal + carbs per activity
- [x] Tab UI: Activities & Nutrition, Food Database, Statistics
- [x] Badge 🥗 on activities with food log
- [x] "Tracked Activities" in Statistics
