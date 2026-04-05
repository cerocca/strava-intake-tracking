# CLAUDE.md — strava-intake-tracking

## Descrizione progetto
WebApp self-hosted per tracciare la nutrizione sportiva integrata con Strava.
Deployabile come container Docker.

Repo GitHub: https://github.com/cerocca/strava-intake-tracking
Cartella locale: /Users/ciru/strava-intake-tracking

## Stack tecnico
- **Backend**: Python 3.12 + FastAPI
- **Frontend**: HTML/CSS/JS vanilla (no framework)
- **Database**: SQLite (via SQLAlchemy)
- **Auth**: OAuth2 con Strava
- **Container**: Docker + docker-compose

## Struttura cartelle
```
strava-intake-tracking/
├── app/
│   ├── main.py              # Entry point FastAPI; GET /locales lists available locale codes
│   ├── config.py            # Configurazione e variabili env
│   ├── database.py          # Setup SQLite/SQLAlchemy + _migrate_db()
│   ├── models/
│   │   ├── activity.py      # Activity (strava_id, kcal da kJ, power metrics)
│   │   ├── app_setting.py   # AppSetting (key/value settings table)
│   │   ├── food.py          # Food (valori per 100g + serving_grams)
│   │   ├── nutrition_log.py # NutritionLog (FK activity+food, quantity_grams)
│   │   └── season.py        # Season (name, season_type, year, start_date, end_date)
│   ├── routers/
│   │   ├── strava.py        # OAuth2 + sync attività; returns athlete_photo, athlete_id
│   │   ├── activities.py    # Lista, dettaglio, filtri, stats, graphs aggregation; _get_excluded_types()
│   │   ├── foods.py         # CRUD database alimentare
│   │   ├── nutrition.py     # Log nutrizione per attività
│   │   ├── seasons.py       # CRUD /seasons con validazione overlap; year field; order by year DESC
│   │   └── settings.py      # GET/POST /settings — key/value app settings (upsert)
│   ├── services/
│   │   ├── strava_service.py    # Token store JSON, auto refresh, fetch Strava
│   │   └── nutrition_service.py # Macro totals per attività
│   └── static/
│       ├── index.html
│       ├── css/style.css
│       ├── locales/
│       │   ├── en.json          # Master locale (229 keys); always loaded as fallback
│       │   └── it.json          # Italian translation; add <code>.json here for new languages
│       └── js/
│           ├── i18n.js          # Thin loader: window.t(key,vars), window.initI18n(settings)
│           ├── app.js           # Core state, theme, sidebar collapse, tab switching; calls initI18n at startup
│           ├── activities.js    # Activity list/cards; escHtml() global utility; season badge
│           ├── foods.js
│           ├── stats.js         # loadTotalStats() + loadSeasonStats() separati
│           ├── seasons.js       # Full-page seasons tab; collapsible form; year field; dropdown populate
│           ├── graphs.js        # Chart.js bar charts: activities/month + distance/month
│           └── settings.js      # Activity type filters; language dropdown (GET /locales); theme radio wired in HTML
├── tests/
├── docker/Dockerfile
├── docker-compose.yml
├── .env.example
├── .env                     # NON in git
├── .gitignore
├── requirements.txt
├── start.sh                 # Attiva venv + uvicorn
├── venv/                    # Python 3.12 — NON in git
├── data/                    # SQLite DB — NON in git
├── CLAUDE.md
├── CHANGELOG.md
├── TODO.md
├── README.md
├── LICENSE
└── ERRORS.md
```

## Regole di sviluppo (OBBLIGATORIE)

### Prima di scrivere codice
- **Pianifica sempre prima**: descrivi brevemente l'approccio prima di implementare
- Per attività con più passaggi, scrivi prima una breve specifica
- Identifica le dipendenze tra componenti prima di iniziare

### Durante lo sviluppo
- **Mantieni tutte le funzionalità esistenti** ad ogni evoluzione (salvo input diverso esplicito)
- **Evita hack rapidi** quando esiste una soluzione più pulita
- Ogni funzione deve avere uno scopo singolo e chiaro
- Gestisci sempre gli errori esplicitamente (no silent failures)
- **UI language**: All interface text must be in English.

### Migrazioni DB
- Usare sempre _migrate_db() in database.py con ALTER TABLE sicuro (non distruttivo)
- Non cancellare mai il DB per aggiungere colonne — aggiungere solo con ADD COLUMN IF NOT EXISTS

### Testing e verifica
- **Esegui i test prima di contrassegnare qualsiasi cosa come completata**
- **Controlla i log prima di affermare che una correzione funziona**
- Testa i casi limite (es. attività senza kcal, alimenti senza tutti i campi)

### Gestione errori e rollback
- **Mantieni sempre una traccia dello step precedente** per poter tornare indietro
- Documenta gli errori ricorrenti in ERRORS.md
- Prima di refactoring significativi, crea un branch o snapshot

### Commit e versioning
- Messaggi di commit chiari: feat:, fix:, docs:, refactor:, test:
- Ogni commit deve rappresentare uno stato funzionante

### Checklist pre-commit (ricordare all'utente PRIMA di ogni commit)
1. CHANGELOG.md — aggiornare con le modifiche fatte
2. TODO.md — spostare le voci completate in ✅, aggiornare 🔄 Ongoing
3. README.md — verificare se le modifiche richiedono aggiornamenti
4. CLAUDE.md — se aggiornato, ricordare all'utente di ricaricarlo nel Project su Claude.ai
5. Solo dopo la conferma dell'utente procedere con git add e git commit

## Variabili d'ambiente (.env)
```
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:8000/auth/callback
DATABASE_URL=sqlite:///./data/intaketracking.db
SECRET_KEY=changeme_generate_a_real_one
```

## Comandi utili
```bash
# Sviluppo locale
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Oppure con lo script
./start.sh

# Docker
docker-compose up --build
docker-compose down
docker-compose logs -f

# Test
pytest tests/ -v

# Reset DB (sviluppo)
rm data/intaketracking.db && uvicorn app.main:app --reload
```

## Note API Strava
- Endpoint attività: GET /athlete/activities
- Kcal: sempre da kilojoules * 0.239006 (lavoro totale)
- Power: average_watts, weighted_average_watts (NP), max_watts
- OAuth2 flow: authorization_code → access_token + refresh_token
- Token scadono ogni 6 ore → refresh automatico con refresh_token
- Scope richiesto: activity:read_all

## Note API OpenFoodFacts
- Ricerca per nome: https://world.openfoodfacts.org/cgi/search.pl?search_terms=QUERY&json=1&page_size=10
- Ricerca per barcode: https://world.openfoodfacts.org/api/v0/product/BARCODE.json
- No autenticazione richiesta
- Campi usati: energy-kcal_100g, carbohydrates_100g, sugars_100g, proteins_100g, fat_100g, saturated-fat_100g, salt_100g, fiber_100g, serving_quantity

## ERRORS.md
File separato per documentare errori ricorrenti e relative soluzioni.
Aggiornare ogni volta che si risolve un bug non banale.
