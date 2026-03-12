import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

from app.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite:///./test_activities.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    from app.models import activity, food, nutrition_log  # noqa: F401
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


client = TestClient(app)


def _create_activity(strava_id=1001, name="Morning Run", calories=400.0):
    from app.models.activity import Activity
    db = TestingSession()
    a = Activity(
        strava_id=strava_id,
        name=name,
        sport_type="Run",
        start_date=datetime.now(timezone.utc),
        distance=10000.0,
        moving_time=3600,
        elapsed_time=3700,
        total_elevation_gain=150.0,
        calories=calories,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    activity_id = a.id
    db.close()
    return activity_id


def test_list_activities_empty():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["items"] == []


def test_list_activities():
    _create_activity(strava_id=1001, name="Run 1")
    _create_activity(strava_id=1002, name="Run 2")
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


def test_get_activity_detail():
    act_id = _create_activity(strava_id=2001, name="Bike Ride", calories=600.0)
    resp = client.get(f"/activities/{act_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Bike Ride"
    assert data["calories"] == 600.0
    assert "nutrition_summary" in data
    assert "strava_url" in data


def test_get_activity_not_found():
    resp = client.get("/activities/99999")
    assert resp.status_code == 404


def test_activities_pagination():
    for i in range(5):
        _create_activity(strava_id=3000 + i, name=f"Activity {i}")
    resp = client.get("/activities?skip=0&limit=2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 5
    assert len(data["items"]) == 2


def test_stats_endpoint():
    _create_activity(strava_id=4001, calories=300.0)
    _create_activity(strava_id=4002, calories=500.0)
    resp = client.get("/activities/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_activities"] == 2
    assert data["total_calories_burned"] == 800.0
