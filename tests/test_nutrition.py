import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone

from app.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite:///./test_nutrition.db"
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


def _create_activity():
    from app.models.activity import Activity
    db = TestingSession()
    a = Activity(
        strava_id=9001,
        name="Test Run",
        sport_type="Run",
        start_date=datetime.now(timezone.utc),
        distance=5000.0,
        moving_time=1800,
        calories=250.0,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    aid = a.id
    db.close()
    return aid


def _create_food(name="Gel", calories=100.0, carbs=25.0):
    resp = client.post("/foods", json={"name": name, "calories": calories, "carbohydrates": carbs, "proteins": 0.0, "fats": 0.0})
    return resp.json()["id"]


def test_add_and_get_nutrition_log():
    act_id = _create_activity()
    food_id = _create_food()

    resp = client.post("/nutrition", json={"activity_id": act_id, "food_id": food_id, "quantity_grams": 60.0})
    assert resp.status_code == 200
    log = resp.json()
    assert log["activity_id"] == act_id
    assert log["food_id"] == food_id
    assert log["quantity_grams"] == 60.0
    assert log["calories"] == 60.0   # 100 kcal/100g × 60g
    assert log["carbohydrates"] == 15.0  # 25g/100g × 60g

    resp2 = client.get(f"/nutrition/{act_id}")
    assert resp2.status_code == 200
    assert len(resp2.json()) == 1


def test_delete_nutrition_log():
    act_id = _create_activity()
    food_id = _create_food(name="Bar")
    log = client.post("/nutrition", json={"activity_id": act_id, "food_id": food_id, "quantity_grams": 50.0}).json()
    resp = client.delete(f"/nutrition/{log['id']}")
    assert resp.status_code == 200
    logs = client.get(f"/nutrition/{act_id}").json()
    assert logs == []


def test_nutrition_invalid_activity():
    food_id = _create_food(name="Water")
    resp = client.post("/nutrition", json={"activity_id": 99999, "food_id": food_id, "quantity_grams": 500.0})
    assert resp.status_code == 404


def test_nutrition_invalid_food():
    act_id = _create_activity()
    resp = client.post("/nutrition", json={"activity_id": act_id, "food_id": 99999, "quantity_grams": 100.0})
    assert resp.status_code == 404


def test_nutrition_summary_in_activity_detail():
    act_id = _create_activity()
    food_id = _create_food(name="Rice Cake", calories=200.0, carbs=45.0)
    client.post("/nutrition", json={"activity_id": act_id, "food_id": food_id, "quantity_grams": 100.0})

    resp = client.get(f"/activities/{act_id}")
    assert resp.status_code == 200
    summary = resp.json()["nutrition_summary"]
    assert summary["calories"] == 200.0
    assert summary["carbohydrates"] == 45.0
