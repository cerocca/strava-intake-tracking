# 🥗 strava-intake-tracking

![Python](https://img.shields.io/badge/python-3.12-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

> Self-hosted sports nutrition tracker integrated with Strava.

---

> **Note**
> This app is in no way affiliated with or part of the official Strava software suite.

---

## ✨ Features

- **Strava OAuth2** — Secure authentication with your Strava account
- **Activity sync** — Import activities with calories calculated from kilojoules (total work)
- **Activity detail** — Duration, distance, elevation gain, heart rate, direct link to Strava
- **Nutrition badge** — Visual indicator 🥗 on activities that have food logs
- **Food database** — Full nutritional fields per 100g: calories, carbohydrates, sugars, proteins, fats, saturated fats, salt, fibers
- **CSV import / export** — Bulk manage your food database
- **Nutrition logging** — Associate foods and quantities to each activity
- **Nutrition summary** — Total kcal and carbohydrate intake per activity
- **Statistics** — Total activities, distance, calories burned, tracked activities
- **Modern UI** — Tab-based interface with cards and clean layout
- **Docker ready** — One-command self-hosted deploy

---

## 📸 Screenshots

> _Coming soon_

---

## 🚀 Quick Start

### With Docker (recommended)

```bash
git clone https://github.com/yourusername/strava-intake-tracking
cd strava-intake-tracking
cp .env.example .env
# Edit .env with your Strava API credentials
docker-compose up --build
```

Open [http://localhost:8000](http://localhost:8000)

### Local development

```bash
git clone https://github.com/yourusername/strava-intake-tracking
cd strava-intake-tracking
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Strava API credentials
./start.sh
```

---

## ⚙️ Configuration

### 1. Create a Strava API application

1. Go to [https://www.strava.com/settings/api](https://www.strava.com/settings/api)
2. Create a new application (or use an existing one)
3. Set **Authorization Callback Domain** to `localhost`
4. Copy your **Client ID** and **Client Secret**

### 2. Configure environment variables

Edit `.env`:

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:8000/auth/callback
DATABASE_URL=sqlite:///./data/intaketracking.db
SECRET_KEY=your_random_secret_key
```

Generate a secure secret key:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🗂 Project Structure

```
strava-intake-tracking/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings & env vars
│   ├── database.py          # SQLite / SQLAlchemy setup
│   ├── models/              # DB models
│   ├── routers/             # API routes
│   ├── services/            # Business logic
│   └── static/              # Frontend (HTML/CSS/JS)
├── tests/
├── docker/Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12 + FastAPI |
| Database | SQLite via SQLAlchemy |
| Frontend | HTML / CSS / Vanilla JS |
| Auth | Strava OAuth2 |
| Container | Docker + docker-compose |

---

## 📡 API Docs

With the app running, visit [http://localhost:8000/docs](http://localhost:8000/docs) for the interactive Swagger UI.

---

## 🧪 Tests

```bash
source venv/bin/activate
pytest tests/ -v
```

---

## 📄 License

MIT
