# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
