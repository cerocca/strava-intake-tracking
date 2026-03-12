# CLAUDE.md — strava-intake-tracking

## Descrizione progetto
WebApp self-hosted per tracciare la nutrizione sportiva integrata con Strava.
Deployabile come container Docker.

Repo GitHub: https://github.com/yourusername/strava-intake-tracking
Cartella locale: /Users/ciru/strava-intake-tracking

## Stack tecnico
- **Backend**: Python 3.11 + FastAPI
- **Frontend**: HTML/CSS/JS vanilla (no framework)
- **Database**: SQLite (via SQLAlchemy)
- **Auth**: OAuth2 con Strava
- **Container**: Docker + docker-compose

## Struttura cartelle
```
strava-intake-tracking/
├── app/
│   ├── main.py              # Entry point FastAPI
│   ├── config.py            # Configurazione e variabili env
│   ├── database.py          # Setup SQLite/SQLAlchemy
│   ├── models/
│   │   ├── activity.py
│   │   ├── food.py
│   │   └── nutrition_log.py
│   ├── routers/
│   │   ├── strava.py        # OAuth2 + sync attività
│   │   ├── foods.py         # CRUD database alimentare
│   │   └── nutrition.py     # Log nutrizione per attività
│   ├── services/
│   │   ├── strava_service.py
│   │   └── nutrition_service.py
│   └── static/
│       ├── index.html
│       ├── css/style.css
│       └── js/
│           ├── app.js
│           ├── activities.js
│           ├── foods.js
│           └── stats.js
├── tests/
├── docker/Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
├── requirements.txt
├── CLAUDE.md
├── ERRORS.md
└── README.md
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

### Testing e verifica
- **Esegui i test prima di contrassegnare qualsiasi cosa come completata**
- **Controlla i log prima di affermare che una correzione funziona**
- Testa i casi limite (es. attività senza kcal, alimenti senza tutti i campi)

### Gestione errori e rollback
- **Mantieni sempre una traccia dello step precedente** per poter tornare indietro
- Documenta gli errori ricorrenti in `ERRORS.md`
- Prima di refactoring significativi, crea un branch o snapshot

### Commit e versioning
- Messaggi di commit chiari: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Ogni commit deve rappresentare uno stato funzionante

### ⚠️ Checklist pre-commit (ricordare all'utente PRIMA di ogni commit)
1. **CHANGELOG.md** — aggiornare la sezione `[Unreleased]` con le modifiche fatte
2. **README.md** — verificare se le modifiche richiedono aggiornamenti (features, stack, roadmap)
3. **CLAUDE.md** — se aggiornato, ricordare all'utente di ricaricarlo nel Project su Claude.ai
4. Solo dopo la conferma dell'utente procedere con `git add` e `git commit`

## Roadmap

### v1.0 — Core
- [x] Setup FastAPI + SQLite + Docker
- [x] Struttura progetto e configurazione
- [ ] OAuth2 Strava (client ID / client secret)
- [ ] Sync attività Strava (kcal con fallback da kilojoules)
- [ ] Visualizzazione attività con dettaglio (durata, distanza, link Strava)
- [ ] Database alimentare (calorie, carbs, zuccheri, proteine, grassi, sale)
- [ ] Import/export alimenti via CSV

### v1.1 — Nutrizione
- [ ] Associazione cibi a ogni attività con quantità
- [ ] Calcolo kcal e carboidrati totali assunti per attività
- [ ] UI a schede/tab (Attività & Nutrizione, Database Alimentare, Statistiche)

### v1.2 — UI/UX polish
- [ ] Styling moderno con tabs arrotondati e card
- [ ] Dettaglio attività cliccabile
- [ ] Statistiche aggregate

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
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

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
- Kcal: usare campo `calories` se presente, altrimenti `kilojoules * 0.239006`
- OAuth2 flow: authorization_code → access_token + refresh_token
- Token scadono ogni 6 ore → gestire refresh automatico con refresh_token
- Scope richiesto: `activity:read_all`

## ERRORS.md
File separato per documentare errori ricorrenti e relative soluzioni.
Aggiornare ogni volta che si risolve un bug non banale.
