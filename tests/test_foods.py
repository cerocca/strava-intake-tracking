import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

TEST_DB_URL = "sqlite:///./test_foods.db"
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


def test_create_food():
    resp = client.post("/foods", json={"name": "Banana", "calories": 89.0})
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Banana"
    assert data["calories"] == 89.0
    assert data["id"] is not None


def test_list_foods():
    client.post("/foods", json={"name": "Apple", "calories": 52.0})
    client.post("/foods", json={"name": "Orange", "calories": 47.0})
    resp = client.get("/foods")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_search_foods():
    client.post("/foods", json={"name": "Chocolate Bar", "calories": 500.0})
    client.post("/foods", json={"name": "Chocolate Milk", "calories": 63.0})
    client.post("/foods", json={"name": "Apple", "calories": 52.0})
    resp = client.get("/foods?search=choc")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) == 2
    assert all("hocolat" in r["name"] for r in results)


def test_update_food():
    created = client.post("/foods", json={"name": "Test", "calories": 100.0}).json()
    resp = client.put(f"/foods/{created['id']}", json={"name": "Test Updated", "calories": 120.0})
    assert resp.status_code == 200
    assert resp.json()["name"] == "Test Updated"
    assert resp.json()["calories"] == 120.0


def test_delete_food():
    created = client.post("/foods", json={"name": "ToDelete", "calories": 50.0}).json()
    resp = client.delete(f"/foods/{created['id']}")
    assert resp.status_code == 200
    all_foods = client.get("/foods").json()
    assert not any(f["id"] == created["id"] for f in all_foods)


def test_delete_nonexistent_food():
    resp = client.delete("/foods/99999")
    assert resp.status_code == 404


def test_food_with_full_nutrition():
    data = {
        "name": "Oats",
        "calories": 389.0,
        "carbohydrates": 66.3,
        "sugars": 0.0,
        "proteins": 16.9,
        "fats": 6.9,
        "saturated_fats": 1.2,
        "salt": 0.0,
    }
    resp = client.post("/foods", json=data)
    assert resp.status_code == 200
    food = resp.json()
    assert food["carbohydrates"] == 66.3
    assert food["proteins"] == 16.9
