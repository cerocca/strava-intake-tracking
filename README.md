# 🥗 Strava Intake Tracker

![Version](https://img.shields.io/badge/version-0.6.1-orange)
![Python](https://img.shields.io/badge/python-3.12-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

> Self-hosted sports nutrition tracker integrated with Strava.

> **Note:** This app is in no way affiliated with or part of the official Strava software suite.

---

## What it does

Strava Intake Tracker connects to your Strava account and lets you log the food you eat during and around your training sessions. It calculates nutrition totals per activity — calories consumed vs. burned, carbs per hour, macros — and shows trends over time through charts and statistics.

---

## 📸 Screenshots

> _Coming soon_

---

## ✨ Features

**Activity tracking**
- Strava OAuth2 login and activity sync (last 100 activities); full history import via curl
- Calories calculated from kilojoules (total work)
- Duration, distance, elevation, heart rate, power metrics, direct Strava link
- Card and list view toggle; tracked 🥗 indicator; season badge

**Nutrition logging**
- Full food database with nutritional values per 100g (kcal, carbs, sugars, proteins, fats, saturated fats, salt, fibers)
- Optional default portion weight per food item
- OpenFoodFacts integration — search by name or barcode and import in one click
- CSV import / export for bulk food management
- Per-activity nutrition summary: kcal consumed, carbs/h, macros donut, kcal vs burned bar, food list with proportional bars and item detail modal

**Seasons**
- Define training seasons (name, type, year, date range) with no-overlap validation
- Activities automatically tagged to their season
- Filter Activities, Statistics, and Graphs by season

**Statistics & graphs**
- Total Stats (all-time) and Season Stats with the same metrics side by side
- Activities per month, distance per month, kcal scatter, carbs scatter, kcal ratio bar, macros doughnut, kcal by sport type — powered by Chart.js
- Activity type exclusion filters persisted in the database

**App & UX**
- Dark / light / system theme with CSS custom properties
- Multi-language UI (English and Italian included; drop a `locales/<code>.json` to add more)
- Collapsible sidebar; collapse state persisted in localStorage
- User menu: athlete name & photo → View Strava profile → Sync last activities → Disconnect
- Dynamic version display with latest GitHub release link
- Docker-ready for one-command self-hosted deploy

---

## 🚀 Quick Start

See **[SETUP.md](SETUP.md)** for full installation, configuration, and Docker instructions.

**Docker (recommended):**
```bash
git clone https://github.com/cerocca/strava-intake-tracking
cd strava-intake-tracking
cp .env.example .env          # add your Strava credentials
docker-compose up --build
```

**Local dev:**
```bash
git clone https://github.com/cerocca/strava-intake-tracking
cd strava-intake-tracking
python3.12 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # add your Strava credentials
./start.sh
```

Open [http://localhost:8000](http://localhost:8000)

---

## 📡 API Docs

Interactive Swagger UI available at [http://localhost:8000/docs](http://localhost:8000/docs) while the app is running.

---

## 📄 License

MIT
