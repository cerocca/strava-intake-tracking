# CLAUDE.md — strava-intake-tracking

## Project description

Self-hosted sports nutrition tracker integrated with Strava.
Deployable as a Docker container.

GitHub repo: https://github.com/cerocca/strava-intake-tracking

## Tech stack

- **Backend**: Python 3.12 + FastAPI
- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **Database**: SQLite (via SQLAlchemy)
- **Auth**: OAuth2 with Strava
- **Container**: Docker + docker-compose

## Folder structure

```
strava-intake-tracking/   ← project root
├── app/
│   ├── main.py              # FastAPI entry point; GET /locales lists available locale codes
│   ├── config.py            # Configuration and env vars
│   ├── database.py          # SQLite/SQLAlchemy setup + _migrate_db()
│   ├── models/
│   │   ├── activity.py      # Activity (strava_id, kcal from kJ, power metrics)
│   │   ├── app_setting.py   # AppSetting (key/value settings table)
│   │   ├── food.py          # Food (values per 100g + serving_grams)
│   │   ├── nutrition_log.py # NutritionLog (FK activity+food, quantity_grams)
│   │   └── season.py        # Season (name, season_type, year, start_date, end_date)
│   ├── routers/
│   │   ├── strava.py        # Two routers: router(/auth) + strava_router(/strava); _upsert_activities() shared helper; POST /strava/sync-all for full history; returns athlete_photo, athlete_id
│   │   ├── activities.py    # List, detail, filters, stats, graphs aggregation; _get_excluded_types()
│   │   ├── foods.py         # Food database CRUD
│   │   ├── nutrition.py     # Nutrition log per activity
│   │   ├── seasons.py       # CRUD /seasons with overlap validation; year field; order by year DESC
│   │   └── settings.py      # GET/POST /settings — key/value app settings (upsert)
│   ├── services/
│   │   ├── strava_service.py    # JSON token store, auto-refresh, Strava fetch; fetch_all_activities() paginates all pages
│   │   └── nutrition_service.py # Macro totals per activity
│   └── static/
│       ├── index.html
│       ├── css/style.css
│       ├── locales/
│       │   ├── en.json          # Master locale (234 keys); always loaded as fallback
│       │   └── it.json          # Italian translation; add <code>.json here for new languages
│       └── js/
│           ├── i18n.js          # Thin loader: window.t(key,vars), window.initI18n(settings)
│           ├── app.js           # Core state, theme, sidebar collapse, tab switching; calls initI18n at startup
│           ├── activities.js    # Activity list/cards; escHtml() global utility; season badge
│           ├── foods.js
│           ├── stats.js         # loadTotalStats() + loadSeasonStats() separate
│           ├── seasons.js       # Full-page seasons tab; collapsible form; year field; dropdown populate
│           ├── graphs.js        # Chart.js bar charts: activities/month + distance/month
│           └── settings.js      # Activity type filters; language dropdown (GET /locales); theme radio wired in HTML; Strava history section (loadStravaHistorySection)
├── tests/
├── docker/Dockerfile
├── docker-compose.yml
├── .env.example
├── .env                     # NOT in git
├── .gitignore
├── requirements.txt
├── start.sh                 # Activates venv + uvicorn
├── venv/                    # Python 3.12 — NOT in git
├── data/                    # SQLite DB — NOT in git
├── CLAUDE.md
├── CHANGELOG.md
├── TODO.md
├── README.md
├── LICENSE
└── ERRORS.md
```

## CSS conventions (style.css)

- **Custom properties**: always preserve `--bg`, `--surface`, `--border`, `--text`, `--text-muted`, `--text-light`, `--accent`, `--strava`, `--radius`, `--radius-sm`, `--shadow`, `--shadow-md`, `--header-h`, `--sidebar-w`
- **Responsive breakpoints** (always add at the bottom of the file, in this order):
  - `max-width: 1024px` — stat grid 2-col
  - `max-width: 768px` — sidebar → fixed bottom nav, touch targets ≥44px, logo text hidden, toast above nav
  - `max-width: 640px` — 1-col for everything, smaller fonts, stacked forms, reduced padding
- **Mobile sidebar**: at ≤768px `.sidebar` becomes `position: fixed; bottom: 0; flex-direction: row`; `.sidebar-label` remains visible (font 0.58rem); `.sidebar-bottom` hidden; `.sidebar-toggle-btn` hidden
- **Controlled horizontal scroll**: use `overflow-x: auto` on the specific container (e.g. `.seasons-list-page`), not on `.main`; `.main` keeps `overflow-x: hidden` to prevent content bleeding over the sidebar; set consistent `min-width` on table headers and rows
- **Spacing rhythm**: multiples of 4px/8px for padding and margin; badges use `padding: 4px Xpx`
- **Touch targets**: on mobile all interactive elements must have `min-height: 44px`
- **Chart.js canvas**: `.graph-card canvas { max-width: 100%; display: block; }` — do not remove

## Development rules (MANDATORY)

### Before writing code
- **Always plan first**: briefly describe the approach before implementing
- For multi-step tasks, write a short spec first
- Identify dependencies between components before starting

### During development
- **Preserve all existing functionality** at every iteration (unless explicitly told otherwise)
- **Avoid quick hacks** when a cleaner solution exists
- Every function must have a single, clear purpose
- Always handle errors explicitly (no silent failures)
- **UI language**: All interface text must be in English.

### DB migrations
- Always use `_migrate_db()` in `database.py` with safe ALTER TABLE (non-destructive)
- Never delete the DB to add columns — only use `ADD COLUMN IF NOT EXISTS`

### Testing and verification
- **Run tests before marking anything as done**
- **Check logs before claiming a fix works**
- Test edge cases (e.g. activities without kcal, foods without all fields)

### Error handling and rollback
- **Always keep track of the previous step** to be able to roll back
- Document recurring errors in ERRORS.md
- Before significant refactors, create a branch or snapshot

### Commit and versioning
- Clear commit messages: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Every commit must represent a working state

### Pre-commit checklist (remind the user BEFORE every commit)
1. CHANGELOG.md — update with the changes made
2. TODO.md — move completed items to ✅, update 🔄 Ongoing
3. README.md — check if changes require documentation updates
4. Only after the user confirms, proceed with `git add` and `git commit`

## Environment variables (.env)

```
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:8000/auth/callback
DATABASE_URL=sqlite:///./data/intaketracking.db
SECRET_KEY=changeme_generate_a_real_one
```

## Useful commands

```bash
# Local development
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Or with the convenience script
./start.sh

# Docker
docker-compose up --build
docker-compose down
docker-compose logs -f

# Tests
pytest tests/ -v

# Reset DB (development only)
rm data/intaketracking.db && uvicorn app.main:app --reload
```

## Strava API notes

- Activities endpoint: `GET /athlete/activities`
- Kcal: always from `kilojoules * 0.239006` (total work)
- Power: `average_watts`, `weighted_average_watts` (NP), `max_watts`
- OAuth2 flow: `authorization_code` → `access_token` + `refresh_token`
- Tokens expire every 6 hours → automatic refresh via `refresh_token`
- Required scope: `activity:read_all`

## OpenFoodFacts API notes

- Search by name: `https://world.openfoodfacts.org/cgi/search.pl?search_terms=QUERY&json=1&page_size=10`
- Search by barcode: `https://world.openfoodfacts.org/api/v0/product/BARCODE.json`
- No authentication required
- Fields used: `energy-kcal_100g`, `carbohydrates_100g`, `sugars_100g`, `proteins_100g`, `fat_100g`, `saturated-fat_100g`, `salt_100g`, `fiber_100g`, `serving_quantity`

## ERRORS.md

Separate file for documenting recurring errors and their solutions.
Update whenever a non-trivial bug is resolved.
