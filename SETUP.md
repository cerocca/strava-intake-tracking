# Setup Guide

## Prerequisites

- Python 3.12+
- A Strava account and API application (create one at https://www.strava.com/settings/api)
- Docker and docker-compose (optional, for container deployment)

## Quick Start (local)

1. Clone the repository and enter the project directory.
2. Copy `.env.example` to `.env` and fill in your Strava credentials:
   ```
   STRAVA_CLIENT_ID=your_client_id
   STRAVA_CLIENT_SECRET=your_client_secret
   STRAVA_REDIRECT_URI=http://localhost:8000/auth/callback
   DATABASE_URL=sqlite:///./data/intaketracking.db
   SECRET_KEY=generate_a_random_string_here
   ```
3. Create a virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
4. Start the app:
   ```bash
   ./start.sh
   ```
   Or manually:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
5. Open http://localhost:8000 in your browser and connect your Strava account.

## Docker

```bash
docker-compose up --build
```

The app will be available at http://localhost:8000.

---

## Usage

### Syncing recent activities

Click your avatar in the top-right corner and select **Sync last activities**. This fetches up to the last 100 activities from Strava and imports any new ones.

### Syncing Strava history

The in-app sync is limited to the last 100 activities. To import your full Strava history, run the following command from your terminal **while the app is running**:

```bash
curl -X POST http://localhost:8000/strava/sync-all
```

This paginates through your entire Strava history and upserts all activities into the local database. It may take a moment depending on the size of your Strava history.
