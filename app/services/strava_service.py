import json
import os
from datetime import datetime, timezone

import httpx

from app.config import settings

TOKEN_FILE = "data/strava_token.json"


def save_token(token_data: dict) -> None:
    os.makedirs("data", exist_ok=True)
    with open(TOKEN_FILE, "w") as f:
        json.dump(token_data, f)


def load_token() -> dict | None:
    if not os.path.exists(TOKEN_FILE):
        return None
    with open(TOKEN_FILE) as f:
        return json.load(f)


def clear_token() -> None:
    if os.path.exists(TOKEN_FILE):
        os.remove(TOKEN_FILE)


async def get_valid_access_token() -> str | None:
    token = load_token()
    if not token:
        return None

    # Refresh if expiring within 5 minutes
    expires_at = token.get("expires_at", 0)
    now = datetime.now(timezone.utc).timestamp()
    if expires_at < now + 300:
        refreshed = await _refresh_token(token["refresh_token"])
        if not refreshed:
            return None
        token = refreshed

    return token.get("access_token")


async def _refresh_token(refresh_token: str) -> dict | None:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.strava.com/oauth/token",
            data={
                "client_id": settings.strava_client_id,
                "client_secret": settings.strava_client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
    if resp.status_code != 200:
        return None
    data = resp.json()
    # Preserve existing athlete info if not returned by refresh
    existing = load_token() or {}
    if "athlete" not in data and "athlete" in existing:
        data["athlete"] = existing["athlete"]
    save_token(data)
    return data


async def exchange_code(code: str) -> dict | None:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://www.strava.com/oauth/token",
            data={
                "client_id": settings.strava_client_id,
                "client_secret": settings.strava_client_secret,
                "code": code,
                "grant_type": "authorization_code",
            },
        )
    if resp.status_code != 200:
        return None
    data = resp.json()
    save_token(data)
    return data


async def fetch_athlete() -> dict | None:
    access_token = await get_valid_access_token()
    if not access_token:
        return None
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.strava.com/api/v3/athlete",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10.0,
        )
    if resp.status_code != 200:
        return None
    return resp.json()


async def fetch_activities(per_page: int = 100, page: int = 1) -> list[dict]:
    access_token = await get_valid_access_token()
    if not access_token:
        return []

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://www.strava.com/api/v3/athlete/activities",
            headers={"Authorization": f"Bearer {access_token}"},
            params={"per_page": per_page, "page": page},
            timeout=30.0,
        )
    if resp.status_code != 200:
        return []
    return resp.json()
