# TODO

## 🔄 Ongoing

---

## 🗺 Roadmap / Future ideas

- [ ] **Minor UI polish** — ongoing refinements to spacing, typography, and layout details; usare skill `frontend-design` di Anthropic come guida per il passaggio di polish UI una volta completata la struttura funzionale
- [ ] **Dynamic version alert** — notify user when local version is behind latest GitHub release
- [ ] **Language support** — additional languages beyond English placeholder
- [ ] Sync all Strava activities (currently limited to last 100)

---

## ✅ Completed

### v0.5.2
- [x] **Sync button broken after sync**: `btn.textContent` was destroying the icon/label spans; fixed to update only the label span
- [x] **Version number stuck at 0.4.3**: updated `APP_VERSION` in `config.py` to `0.5.2`

### v0.5.1
- [x] **Statistics tab — Total/Season tab switcher**: independent tabs with lazy season dropdown; replaces always-visible dual sections
- [x] **Graphs tab — Total/Season tab switcher**: same pattern; switching back to Total reloads unfiltered data
- [x] **Season notes field**: optional notes on each season; form field + column in seasons list with proper header alignment

### v0.5.0
- [x] **Graphs tab — extended charts**: 5 nutrition charts (scatter, bar, doughnut) in both Total and Season sections; scoped canvas IDs; `GET /activities/graphs/nutrition` endpoint with season_id filter
- [x] **Activity detail — Nutrition Summary**: stat cards (kcal consumed, carbs/h moving, carbs/h elapsed), macros donut, kcal vs burned bar, visual food list with proportional bars
- [x] **Food detail modal**: clickable food rows open read-only modal with per-100g macros, serving size, OFF link
- [x] **Dynamic season labels in Graphs**: Activities & Distance and Nutrition Charts titles update to season name + date range

### v0.4.3
- [x] Food Database: OFF product page link (badge) on foods imported from OpenFoodFacts
- [x] Static files: Cache-Control: no-store for JS and CSS to prevent stale cache

### v0.4.2
- [x] Activities list: removed duplicate energy badge (⚡ kJ appears only once per card)
- [x] Seasons screen: sort bar (Year, Name, Start date, End date) with ASC/DESC toggle and arrow indicator
- [x] Seasons screen: real-time search field filtering by name and season type
- [x] macOS launcher: `Start Strava Intake.command` and `Stop Strava Intake.command`

### v0.4
- [x] Collapsible sidebar navigation (replaces horizontal tabs); state persisted in localStorage
- [x] Dark / light / system theme with CSS custom properties; persisted in localStorage
- [x] Graphs tab implemented: activities per month + distance per month bar charts (Chart.js)
- [x] Season year field (optional); displayed as badge; ordered by year DESC
- [x] Settings tab: Appearance (theme), Language (placeholder), Activity Filters
- [x] Activity type filters persisted in DB (AppSetting model + /settings endpoint); applied to all stats and graphs
- [x] Season badge on activity list cards and list items
- [x] GitHub icon in header
- [x] Sidebar footer: version + "Powered by Strava" (footer moved from page bottom)

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
