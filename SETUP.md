# SETUP.md — Strava Intake Tracker

Complete installation, configuration, and technical reference.

---

## Table of contents

1. [Requirements](#requirements)
2. [Strava API setup](#strava-api-setup)
3. [Environment variables](#environment-variables)
4. [Installation — Docker](#installation--docker-recommended)
5. [Installation — Local dev](#installation--local-dev)
6. [macOS launcher scripts](#macos-launcher-scripts)
7. [Usage](#usage)
8. [Upgrading](#upgrading)
9. [Project structure](#project-structure)
10. [Tech stack](#tech-stack)
11. [Database & migrations](#database--migrations)
12. [Localization](#localization)

---

## Requirements

| Dependency | Version |
|---|---|
| Python | 3.12 |
| Docker + docker-compose | any recent |
| A Strava account | — |

---

## Strava API setup

1. Go to [https://www.strava.com/settings/api](https://www.strava.com/settings/api)
2. Create a new application (or use an existing one)
3. Set **Authorization Callback Domain** to `localhost`
4. Copy your **Client ID** and **Client Secret** — you'll need them in the next step

---

## Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:8000/auth/callback
DATABASE_URL=sqlite:///./data/intaketracking.db
SECRET_KEY=your_random_secret_key
```

Generate a secure `SECRET_KEY`:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## Installation — Docker (recommended)

```bash
git clone https://github.com/cerocca/strava-intake-tracking
cd strava-intake-tracking
cp .env.example .env
# edit .env with your credentials
docker-compose up --build
```

Open [http://localhost:8000](http://localhost:8000).

Stop the app:

```bash
docker-compose down
```

View logs:

```bash
docker-compose logs -f
```

---

## Installation — Local dev

```bash
git clone https://github.com/cerocca/strava-intake-tracking
cd strava-intake-tracking

python3.12 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# edit .env with your credentials

./start.sh
```

Or run directly with uvicorn (with hot reload):

```bash
uvicorn app.main:app --reload --port 8000
```

Reset the database during development:

```bash
rm data/intaketracking.db
uvicorn app.main:app --reload
```

---

## macOS launcher scripts

Two convenience scripts in the project root let you run the app without opening a terminal:

| Script | Action |
|---|---|
| `Start Strava Intake.command` | Activates venv and starts the server in the background |
| `Stop Strava Intake.command` | Stops the background server |

Double-click either script in Finder. On first use you may need to allow execution:

```bash
chmod +x "Start Strava Intake.command" "Stop Strava Intake.command"
```

---

## Usage

### Syncing recent activities

Click your avatar in the top-right corner and select **Sync last activities**. This fetches the last 100 activities from Strava and imports any new ones. The menu shows a live count on completion.

### Syncing full Strava history

The in-app sync is limited to the last 100 activities. To import your full Strava history, run the following command from your terminal **while the app is running**:

```bash
curl -X POST http://localhost:8000/strava/sync-all
```

This paginates through your entire Strava history (200 activities per page) and upserts all activities into the local database. Run it once after first setup to backfill older activities. It may take a moment depending on the size of your history.

---

## Upgrading

```bash
git pull
source venv/bin/activate
pip install -r requirements.txt   # pick up any new dependencies
./start.sh
```

The app runs `_migrate_db()` at startup and applies any new columns automatically — no manual migration needed and no data loss.

For Docker:

```bash
git pull
docker-compose up --build
```

---

## Project structure

```
strava-intake-tracking/
├── app/
│   ├── main.py              # FastAPI entry point; GET /locales lists available locale codes
│   ├── config.py            # Settings & environment variables
│   ├── database.py          # SQLite / SQLAlchemy setup + _migrate_db()
│   ├── models/
│   │   ├── activity.py      # Activity (strava_id, kcal from kJ, power metrics)
│   │   ├── app_setting.py   # AppSetting (key/value settings table)
│   │   ├── food.py          # Food (values per 100g + serving_grams)
│   │   ├── nutrition_log.py # NutritionLog (FK activity + food, quantity_grams)
│   │   └── season.py        # Season (name, season_type, year, start_date, end_date)
│   ├── routers/
│   │   ├── strava.py        # OAuth2 + activity sync; _upsert_activities() shared helper;
│   │   │                    # strava_router with POST /strava/sync-all (full history)
│   │   ├── activities.py    # List, detail, filters, stats, graph aggregation
│   │   ├── foods.py         # Food database CRUD + CSV import/export
│   │   ├── nutrition.py     # Nutrition log per activity
│   │   ├── seasons.py       # Season CRUD with overlap validation
│   │   └── settings.py      # GET/POST /settings (key/value upsert)
│   ├── services/
│   │   ├── strava_service.py    # Token store (JSON), auto-refresh, Strava API calls;
│   │   │                        # fetch_all_activities() for full history pagination
│   │   └── nutrition_service.py # Macro totals per activity
│   └── static/
│       ├── index.html
│       ├── css/style.css
│       ├── locales/
│       │   ├── en.json      # Master locale (always loaded as fallback)
│       │   └── it.json      # Italian translation
│       └── js/
│           ├── i18n.js      # window.t(key, vars), window.initI18n(settings)
│           ├── app.js       # Core state, theme, sidebar collapse, tab switching
│           ├── activities.js
│           ├── foods.js
│           ├── stats.js
│           ├── seasons.js
│           ├── graphs.js    # Chart.js charts
│           └── settings.js
├── tests/
├── docker/Dockerfile
├── docker-compose.yml
├── requirements.txt
├── start.sh
├── .env.example
├── CLAUDE.md
├── CHANGELOG.md
├── TODO.md
├── README.md
└── SETUP.md
```

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12 + FastAPI |
| Database | SQLite via SQLAlchemy |
| Frontend | HTML / CSS / Vanilla JS |
| Charts | Chart.js |
| Auth | Strava OAuth2 |
| Container | Docker + docker-compose |
| Food data | OpenFoodFacts API (name search + barcode) |

### Key API notes

**Strava**
- Endpoint: `GET /athlete/activities`
- Calories always derived from `kilojoules * 0.239006` (total work)
- Power fields: `average_watts`, `weighted_average_watts` (NP), `max_watts`
- Tokens expire every 6 hours → auto-refreshed via `refresh_token`
- Required OAuth scope: `activity:read_all`
- Rate limit: 100 requests / 15 min, 1000 / day

**OpenFoodFacts**
- Name search: `https://world.openfoodfacts.org/cgi/search.pl?search_terms=QUERY&json=1&page_size=10`
- Barcode lookup: `https://world.openfoodfacts.org/api/v0/product/BARCODE.json`
- No authentication required
- Fields used: `energy-kcal_100g`, `carbohydrates_100g`, `sugars_100g`, `proteins_100g`, `fat_100g`, `saturated-fat_100g`, `salt_100g`, `fiber_100g`, `serving_quantity`

---

## Database & migrations

The database is a single SQLite file at `data/intaketracking.db` (excluded from git).

Schema migrations are handled automatically by `_migrate_db()` in `database.py` at every startup. Migrations are additive only (`ADD COLUMN IF NOT EXISTS`) — no data is ever dropped.

To inspect the database directly:

```bash
sqlite3 data/intaketracking.db
.tables
.schema activities
```

---

## Localization

The app ships with English (`en.json`) and Italian (`it.json`).

To add a new language:

1. Copy `app/static/locales/en.json` to `app/static/locales/<code>.json` (e.g. `fr.json`)
2. Translate the values (keys must stay the same)
3. Restart the app — the new language appears automatically in the Settings dropdown

`en.json` is always loaded as a fallback for any missing keys in other locales.
