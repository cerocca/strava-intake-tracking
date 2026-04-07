from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import glob
import os
import httpx

from app.database import init_db
from app.routers import strava, foods, nutrition, activities, seasons, settings
from app.config import APP_VERSION


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Strava Intake Tracking",
    description="Self-hosted sports nutrition tracker integrated with Strava",
    version="1.0.0",
    lifespan=lifespan,
)

# API routers
app.include_router(strava.router)
app.include_router(strava.strava_router)
app.include_router(activities.router)
app.include_router(foods.router)
app.include_router(nutrition.router)
app.include_router(seasons.router)
app.include_router(settings.router)

# Serve static frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.middleware("http")
async def no_cache_js_css(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static/") and request.url.path.endswith((".js", ".css")):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/")
async def root():
    return FileResponse(os.path.join(static_dir, "index.html"))


@app.get("/health")
async def health():
    return {"status": "ok", "app": "strava-intake-tracking"}


@app.get("/version")
async def version():
    return {"version": APP_VERSION}


@app.get("/version/latest")
async def version_latest():
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(
                "https://api.github.com/repos/cerocca/strava-intake-tracking/releases/latest",
                headers={"Accept": "application/vnd.github+json"},
            )
            resp.raise_for_status()
            data = resp.json()
            tag = data.get("tag_name", "")
            url = data.get("html_url", "")
            # Strip leading 'v' for consistent comparison
            version_str = tag.lstrip("v") if tag else None
            return {"latest": version_str, "url": url or None}
    except Exception:
        return {"latest": None, "url": None}


@app.get("/locales")
async def list_locales():
    """Return sorted list of available locale codes from app/static/locales/."""
    locales_dir = os.path.join(static_dir, "locales")
    files = glob.glob(os.path.join(locales_dir, "*.json"))
    codes = sorted(os.path.splitext(os.path.basename(f))[0] for f in files)
    return codes
