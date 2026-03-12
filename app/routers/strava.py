from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.activity import Activity
import app.services.strava_service as strava_service
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["auth"])

STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize"


@router.get("/strava")
async def connect_strava():
    if not settings.strava_client_id:
        raise HTTPException(
            status_code=500,
            detail="STRAVA_CLIENT_ID not configured. Set it in your .env file.",
        )
    params = {
        "client_id": settings.strava_client_id,
        "redirect_uri": settings.strava_redirect_uri,
        "response_type": "code",
        "approval_prompt": "auto",
        "scope": "activity:read_all",
    }
    return RedirectResponse(url=f"{STRAVA_AUTH_URL}?{urlencode(params)}")


@router.get("/callback")
async def strava_callback(code: str, db: Session = Depends(get_db)):
    token_data = await strava_service.exchange_code(code)
    if not token_data:
        raise HTTPException(status_code=400, detail="Failed to exchange authorization code")
    return RedirectResponse(url="/")


@router.get("/status")
async def auth_status():
    token = strava_service.load_token()
    if not token:
        return {"connected": False}
    athlete = token.get("athlete") or {}
    first = athlete.get("firstname", "")
    last = athlete.get("lastname", "")
    return {
        "connected": True,
        "athlete_name": f"{first} {last}".strip() or "Athlete",
        "athlete_id": athlete.get("id"),
    }


@router.post("/disconnect")
async def disconnect():
    strava_service.clear_token()
    return {"status": "disconnected"}


@router.post("/sync")
async def sync_activities(db: Session = Depends(get_db)):
    activities = await strava_service.fetch_activities(per_page=100, page=1)
    if not activities:
        token = strava_service.load_token()
        if not token:
            raise HTTPException(status_code=401, detail="Not connected to Strava")
        return {"synced": 0, "updated": 0, "total": 0}

    synced = 0
    updated = 0

    for act_data in activities:
        # Store kilojoules directly (total mechanical work as shown on Strava)
        kj = act_data.get("kilojoules") or 0
        calories = round(kj, 1) if kj > 0 else None

        # Parse ISO date
        start_date = None
        if raw_date := act_data.get("start_date"):
            try:
                start_date = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
            except ValueError:
                pass

        existing = db.query(Activity).filter(Activity.strava_id == act_data["id"]).first()
        if existing:
            existing.name = act_data.get("name", existing.name)
            existing.calories = calories
            existing.distance = act_data.get("distance", existing.distance)
            updated += 1
        else:
            activity = Activity(
                strava_id=act_data["id"],
                name=act_data.get("name", ""),
                sport_type=act_data.get("sport_type") or act_data.get("type", ""),
                start_date=start_date,
                distance=act_data.get("distance", 0.0),
                moving_time=act_data.get("moving_time", 0),
                elapsed_time=act_data.get("elapsed_time", 0),
                total_elevation_gain=act_data.get("total_elevation_gain", 0.0),
                calories=calories,
                description=act_data.get("description"),
            )
            db.add(activity)
            synced += 1

    db.commit()
    return {"synced": synced, "updated": updated, "total": len(activities)}
