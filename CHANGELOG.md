# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.5] - 2026-04-07

### Added
- **Responsive layout — mobile & tablet**: three explicit breakpoints (640px / 768px / 1024px); no horizontal scroll at any viewport width
- **Sidebar bottom nav on mobile (≤768px)**: sidebar becomes a fixed bottom tab bar with icon + short label; hides sidebar footer and toggle button; accounts for safe-area-inset on notched devices
- **Touch targets**: all interactive elements (buttons, selects, inputs, tab buttons) enforce ≥44px min-height on mobile
- **Stat cards grid collapse**: auto-fill grid → 2-col at ≤1024px → 1-col at ≤640px
- **Graph canvas constraints**: `.graph-card canvas { max-width: 100%; display: block; }` prevents Chart.js overflow on narrow viewports
- **Seasons horizontal scroll**: `.seasons-list-page { overflow-x: auto }` with `min-width: 740px` on header and rows; content always fully visible regardless of screen width

### Changed
- **Activity card hover**: added `transform: translateY(-2px)` lift + `border-color: rgba(252,76,2,.28)` accent; transition extended to include transform
- **Badge padding**: `.activity-kcal-badge`, `.activity-nutrition-badge`, `.activity-season-badge` padding rounded to 4px multiples; `line-height: 1` for consistent vertical alignment
- **Logo**: text span hidden on mobile (≤768px), keeping only the icon
- **Toast**: repositioned to `bottom: 80px` on mobile so it clears the bottom nav bar
- **`body`**: `overflow-x: hidden` added to prevent global horizontal bleed

---

## [0.6.1] - 2026-04-06

### Added
- **Full history sync endpoint** — `POST /strava/sync-all` paginates through the entire Strava history (200 activities per page) and upserts all records; accessible via curl while the app is running
- **Settings tab — Strava history sync section** — new card with translated title, description, `curl` command code block, and note; all strings in `en.json` and `it.json`
- **New i18n keys** — `user_menu.sync_last_activities`, `user_menu.sync_result`, `settings.strava_history.title`, `settings.strava_history.description`, `settings.strava_history.note` added to `en.json` and `it.json`

### Changed
- **Strava sync moved to user dropdown** — "Sync last activities" button in the header avatar menu; shows spinner label while running, then displays synced count for 3 s before resetting; sidebar sync button removed
- **User dropdown — divider** — separator added between athlete name block and "View Strava profile"
- **User dropdown — styling** — "View Strava profile" in Strava orange (`#FC4C02`); "Disconnect" in red (`#dc2626`, bold)
- **Backend refactor** — `_upsert_activities()` extracted as shared helper in `strava.py`; both `/auth/sync` and `/strava/sync-all` use it; `fetch_all_activities()` added to `strava_service.py`

---

## [0.6.0] - 2026-04-05

### Added
- **i18n (multi-language support)**: full internationalisation with no build step required
  - `app/static/locales/en.json` — master English locale (229 keys)
  - `app/static/locales/it.json` — Italian translation (229 keys)
  - `app/static/js/i18n.js` — thin loader exposing `window.t(key, vars)` and `window.initI18n(settings)`
  - `GET /locales` endpoint: lists available language codes from `app/static/locales/*.json`
  - Language preference stored via existing `/settings` key=`language` (zero schema changes)
  - Language dropdown in Settings tab; auto-reloads on change (no extra save button)
  - Adding `locales/de.json` makes Deutsch appear in the dropdown with zero code changes
- **Translation coverage**: all JS-rendered strings replaced with `t()` calls; static HTML elements use `data-i18n` / `data-i18n-placeholder` attributes applied at init before any tab renders
- **Chart.js translated**: dataset labels, axis titles, and tooltip labels use `t()` for all charts (scatter, bar, doughnut)

### Changed
- `DOMContentLoaded` in `app.js` now fetches `/settings` at startup to pass language preference to `initI18n()` before tabs render
- Language section in Settings replaced from disabled placeholder to functional `<select id="language-select">`

---

## [0.5.2] - 2026-04-05

### Fixed
- **Sync button**: `syncActivities()` was calling `btn.textContent = …` which destroyed the inner `<span class="sidebar-icon">` and `<span class="sidebar-label">` elements, leaving the button as unstyled plain text after sync; now updates only the label span's text
- **Version number**: `APP_VERSION` in `config.py` was stuck at `"0.4.3"`; updated to `"0.5.1"` to match the actual release

---

## [0.5.1] - 2026-04-05

### Added
- **Statistics tab — Total/Season tab switcher**: replaces the always-visible dual-section layout; Total and Season views are now independent tabs with a `.tab-switcher` component; Season tab shows a lazy-loaded season dropdown
- **Graphs tab — Total/Season tab switcher**: same pattern as Statistics; Total tab shows all-time charts, Season tab shows a season dropdown + filtered charts; switching back to Total reloads unfiltered data
- **Reusable `.tab-switcher` CSS component**: shared between Statistics and Graphs sections
- **Season notes field**: optional free-text notes on each season; stored in DB (safe migration), shown in the form and in the seasons list as a dedicated column with header

### Changed
- Statistics section header renamed from "Total Stats" / "Season Stats" to a single "Statistics" heading with tab buttons
- Graphs section headers renamed from "Total Graphs" / "Season Graphs" to a single "Graphs" heading with tab buttons
- `loadSeasonStats()` and `loadSeasonGraphs()` accept an optional `seasonId` parameter; fall back to reading the new per-section dropdowns when not provided
- `loadGraphs()` now only loads total graphs (season graphs load on demand via the Season tab)
- `populateSeasonDropdowns()` in seasons.js no longer manages the stats/graphs dropdowns; those are lazily populated and reset on seasons change
- Seasons list: columns are now always-present wrapper spans (Year, Name, Type, Start date, End date, Notes) with matching header labels and consistent min-widths — fixes misalignment when optional fields are absent

---

## [0.5.0] - 2026-04-05

### Added
- **Nutrition Charts in Graphs tab**: 5 new Chart.js charts for tracked activities — Kcal consumed vs kJ produced (scatter), Carbs vs duration (scatter), Kcal ratio consumed/burned (bar), Macros distribution (doughnut), Kcal by sport type (bar); available in both Total (all-time) and Season (filtered) sections with scoped canvas IDs
- **GET /activities/graphs/nutrition**: new backend endpoint returning aggregated nutrition data per tracked activity; supports optional `season_id` filter; applies excluded activity types
- **Activity detail — Nutrition Summary section**: shown only for tracked activities; stat cards (kcal consumed, carbs/h moving time, carbs/h elapsed time), macros donut chart, kcal consumed vs burned horizontal bar, visual food list with proportional kcal bars
- **Food detail modal**: clicking any food row in the activity detail opens a read-only modal with per-100g macros, serving size, and Open Food Facts link (only for foods imported from OFF)
- **Dynamic season labels in Graphs tab**: when a season is selected, Activities & Distance and Nutrition Charts titles/subtitles update to show the season name and date range
- Nutrition log API (`GET /nutrition/{activity_id}`) response extended with `off_id`, `serving_grams`, and per-100g macro values (`kcal_100g`, `carbs_100g`, `sugars_100g`, `proteins_100g`, `fat_100g`, `sat_fat_100g`, `fiber_100g`, `salt_100g`)

### Changed
- Graphs tab restructured: Total and Season sections each contain their own Activities & Distance charts and Nutrition Charts subsection
- `loadNutritionCharts()` refactored to accept a `scope` parameter (`'total'` / `'season'`) with fully scoped canvas and element IDs

---

## [0.4.3] - 2026-04-05

### Added
- Food Database: OFF product page link on foods imported from OpenFoodFacts (visible badge next to food name)
- Static files: Cache-Control: no-store header for JS and CSS files to prevent stale cache issues during development

### Fixed
- OpenFoodFacts import: fixed off_id capture using correct field name (p.code || p.id instead of p.code || p._id)

---

## [0.4.2] - 2026-04-04

### Fixed
- Activities list: removed duplicate energy badge (⚡ kJ now appears only once per card)

### Added
- Seasons screen: sort bar with Year, Name, Start date, End date (client-side, with ASC/DESC toggle and arrow indicator)
- Seasons screen: real-time search field filtering by name and season type
- macOS launcher: `Start Strava Intake.command` and `Stop Strava Intake.command` for starting/stopping the server from Finder without keeping the terminal open

---

## [0.4.1] - 2026-03-24

### Fixed
- Seasons list: increased column spacing (gap, min-width on year badge, name, type tag, dates) for better readability
- Seasons list: added margin-right on type tag to separate it from date range

---

## [0.4.0] - 2026-03-22

### Added
- **Collapsible sidebar**: vertical navigation replaces horizontal tabs; collapse/expand with hamburger button; state persisted in localStorage
- **Dark / light / system theme**: theme selector in Settings tab; CSS custom properties; persisted in localStorage
- **Graphs tab**: implemented with Chart.js — activities per month and distance per month bar charts; season filter supported; excluded activity types applied
- **Season year field**: optional year on Season model; displayed as badge in season list; ordered by year DESC
- **Settings tab**: Appearance (theme), Language (placeholder), Activity Filters (exclude sport types from stats and graphs)
- **Activity type filters**: persisted in DB via new `AppSetting` model and `/settings` endpoint; applied to all stats and graphs (total + season)
- **Season badge on activity list**: `season_name` returned by `GET /activities`; shown as badge on activity cards and list items
- **GitHub icon in header**: direct link to repo
- **Sidebar footer**: version display + "Powered by Strava" branding inside sidebar bottom

### Changed
- Horizontal tabs → collapsible sidebar navigation
- Stats and Graphs are now separate sidebar items (previously combined)
- Seasons moved from user menu modal to full sidebar tab (full-page list + collapsible form)
- User menu simplified: profile, Strava link, Connect/Disconnect only
- Language selector moved from user menu to Settings tab
- Footer moved from page bottom into sidebar bottom area
- `APP_VERSION` bumped to `0.4.0`

---

## [0.3.0] - 2026-03-22

### Added
- **Season tracking**: new Season model (name, season_type, start_date, end_date); full CRUD via `/seasons` endpoint with no-overlap validation; season filter in Activities and Statistics; season badge on activity detail page
- **User menu**: avatar dropdown in header with Strava profile (name, photo, link to Strava profile), Connect/Disconnect, Language selector (English placeholder), Seasons management
- **Statistics redesign**: split into "Total Stats" (all-time, unfiltered) and "Season Stats" (filterable by season)
- **Graphs tab**: placeholder tab added (not yet implemented); will contain Chart.js charts for tracked activities only
- **Footer**: dynamic version display (local + latest from GitHub releases API); "Powered by Strava" branding; GitHub icon linking to repo
- **UI language**: all interface text standardised to English; rule added to CLAUDE.md
- **App version constant**: `APP_VERSION` in `config.py`; exposed via `GET /version` endpoint
- **Athlete profile in API**: `GET /auth/status` now returns `athlete_photo` and `athlete_id`

### Changed
- Header simplified: removed username from header bar (now in user menu only); renamed "Sync" → "Sync Strava"; removed standalone Disconnect/Connect buttons from header
- App name updated to "Strava Intake Tracker" in header
- User menu: Connect/Disconnect moved inside dropdown; Language and Seasons accessible from same menu

---

## [0.2.0] - 2026-03-13

### Added
- List view for activities (toggle between card and list layout)
- "Tracked" flag on activities with food log
- Filter activities by sport type
- Filter activities by tracked / untracked
- Statistics tab: total and average kcal, carbs, sugars consumed (only tracked activities)
- OpenFoodFacts integration: search by name or barcode in Food Database tab
- OpenFoodFacts import: pre-fills the food form with available nutritional data
- Portion weight field (`serving_grams`) in food database — pre-fills quantity when logging food to an activity
- Improved food search when adding foods to activities

---

## [0.1.0] - 2026-03-11

### Added
- Initial project setup — FastAPI + SQLite + Docker
- Strava OAuth2 authentication with automatic token refresh
- Activity sync from Strava with kcal calculated from kilojoules (total work)
- Activity list with card layout and clickable detail view
- Nutrition badge 🥗 on activity cards when food has been logged
- "Tracked Activities" counter in Statistics tab
- Food database with full nutritional fields per 100g: calories, carbohydrates, sugars, proteins, fats, saturated fats, salt, fibers
- CSV import / export for food database
- Nutrition logging — associate foods and quantities to each activity
- Nutrition summary per activity (total kcal and carbs intake)
- Statistics tab: total activities, total distance, total calories burned, tracked activities
- Tab-based UI: Activities & Nutrition, Food Database, Statistics
- Docker + docker-compose support
- `start.sh` convenience script for local development
