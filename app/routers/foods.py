import csv
import io
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.food import Food

router = APIRouter(prefix="/foods", tags=["foods"])

CSV_FIELDS = [
    "name", "brand", "calories", "carbohydrates", "sugars",
    "proteins", "fibers", "fats", "saturated_fats", "salt", "serving_grams", "notes",
]


class FoodIn(BaseModel):
    name: str
    brand: Optional[str] = None
    calories: float
    carbohydrates: Optional[float] = None
    sugars: Optional[float] = None
    proteins: Optional[float] = None
    fibers: Optional[float] = None
    fats: Optional[float] = None
    saturated_fats: Optional[float] = None
    salt: Optional[float] = None
    serving_grams: Optional[float] = None
    notes: Optional[str] = None
    off_id: Optional[str] = None


@router.get("/export-csv")
async def export_foods_csv(db: Session = Depends(get_db)):
    foods = db.query(Food).order_by(Food.name).all()
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=CSV_FIELDS)
    writer.writeheader()
    for f in foods:
        writer.writerow({
            "name": f.name,
            "brand": f.brand or "",
            "calories": f.calories,
            "carbohydrates": f.carbohydrates if f.carbohydrates is not None else "",
            "sugars": f.sugars if f.sugars is not None else "",
            "proteins": f.proteins if f.proteins is not None else "",
            "fibers": f.fibers if f.fibers is not None else "",
            "fats": f.fats if f.fats is not None else "",
            "saturated_fats": f.saturated_fats if f.saturated_fats is not None else "",
            "salt": f.salt if f.salt is not None else "",
            "serving_grams": f.serving_grams if f.serving_grams is not None else "",
            "notes": f.notes or "",
        })
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=foods.csv"},
    )


@router.post("/import-csv")
async def import_foods_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    imported = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        name = (row.get("name") or "").strip()
        if not name:
            continue
        try:
            cal = float(row.get("calories") or 0)
        except ValueError:
            errors.append(f"Row {i}: invalid calories value")
            continue

        food = Food(
            name=name,
            brand=row.get("brand") or None,
            calories=cal,
            carbohydrates=_safe_float(row.get("carbohydrates")),
            sugars=_safe_float(row.get("sugars")),
            proteins=_safe_float(row.get("proteins")),
            fibers=_safe_float(row.get("fibers")),
            fats=_safe_float(row.get("fats")),
            saturated_fats=_safe_float(row.get("saturated_fats")),
            salt=_safe_float(row.get("salt")),
            serving_grams=_safe_float(row.get("serving_grams")),
            notes=row.get("notes") or None,
        )
        db.add(food)
        imported += 1

    db.commit()
    return {"imported": imported, "errors": errors}


@router.get("")
async def list_foods(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
):
    query = db.query(Food)
    if search:
        query = query.filter(Food.name.ilike(f"%{search}%"))
    foods = query.order_by(Food.name).offset(skip).limit(limit).all()
    return [_food_dict(f) for f in foods]


@router.post("")
async def create_food(data: FoodIn, db: Session = Depends(get_db)):
    food = Food(**data.model_dump())
    db.add(food)
    db.commit()
    db.refresh(food)
    return _food_dict(food)


@router.put("/{food_id}")
async def update_food(food_id: int, data: FoodIn, db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    for key, value in data.model_dump().items():
        setattr(food, key, value)
    db.commit()
    db.refresh(food)
    return _food_dict(food)


@router.delete("/{food_id}")
async def delete_food(food_id: int, db: Session = Depends(get_db)):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")
    db.delete(food)
    db.commit()
    return {"status": "deleted"}


def _safe_float(val) -> Optional[float]:
    if val is None or str(val).strip() == "":
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None


def _food_dict(f: Food) -> dict:
    return {
        "id": f.id,
        "name": f.name,
        "brand": f.brand,
        "calories": f.calories,
        "carbohydrates": f.carbohydrates,
        "sugars": f.sugars,
        "proteins": f.proteins,
        "fibers": f.fibers,
        "fats": f.fats,
        "saturated_fats": f.saturated_fats,
        "salt": f.salt,
        "serving_grams": f.serving_grams,
        "notes": f.notes,
        "off_id": f.off_id,
    }
