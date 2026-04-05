from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity import Activity
from app.models.food import Food
from app.models.nutrition_log import NutritionLog

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


class NutritionLogIn(BaseModel):
    activity_id: int
    food_id: int
    quantity_grams: float = Field(gt=0)


@router.get("/{activity_id}")
async def get_nutrition_logs(activity_id: int, db: Session = Depends(get_db)):
    logs = (
        db.query(NutritionLog)
        .filter(NutritionLog.activity_id == activity_id)
        .order_by(NutritionLog.consumed_at)
        .all()
    )
    return [_log_dict(log) for log in logs]


@router.post("")
async def add_nutrition_log(data: NutritionLogIn, db: Session = Depends(get_db)):
    if not db.query(Activity).filter(Activity.id == data.activity_id).first():
        raise HTTPException(status_code=404, detail="Activity not found")
    if not db.query(Food).filter(Food.id == data.food_id).first():
        raise HTTPException(status_code=404, detail="Food not found")

    log = NutritionLog(
        activity_id=data.activity_id,
        food_id=data.food_id,
        quantity_grams=data.quantity_grams,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return _log_dict(log)


@router.delete("/{log_id}")
async def delete_nutrition_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(NutritionLog).filter(NutritionLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")
    db.delete(log)
    db.commit()
    return {"status": "deleted"}


def _log_dict(log: NutritionLog) -> dict:
    food = log.food
    factor = log.quantity_grams / 100.0
    return {
        "id": log.id,
        "activity_id": log.activity_id,
        "food_id": log.food_id,
        "food_name": food.name if food else None,
        "food_brand": food.brand if food else None,
        "quantity_grams": log.quantity_grams,
        "calories": round(food.calories * factor, 1) if food and food.calories else None,
        "carbohydrates": round(food.carbohydrates * factor, 1) if food and food.carbohydrates else None,
        "sugars": round(food.sugars * factor, 1) if food and food.sugars else None,
        "proteins": round(food.proteins * factor, 1) if food and food.proteins else None,
        "fats": round(food.fats * factor, 1) if food and food.fats else None,
        "consumed_at": log.consumed_at.isoformat() if log.consumed_at else None,
        # Food detail fields (per 100g)
        "off_id": food.off_id if food else None,
        "serving_grams": food.serving_grams if food else None,
        "kcal_100g": food.calories if food else None,
        "carbs_100g": food.carbohydrates if food else None,
        "sugars_100g": food.sugars if food else None,
        "proteins_100g": food.proteins if food else None,
        "fat_100g": food.fats if food else None,
        "sat_fat_100g": food.saturated_fats if food else None,
        "fiber_100g": food.fibers if food else None,
        "salt_100g": food.salt if food else None,
    }
