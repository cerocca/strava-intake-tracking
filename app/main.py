from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os

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
