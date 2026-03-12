from sqlalchemy.orm import Session
from app.models.nutrition_log import NutritionLog


def get_activity_nutrition_summary(activity_id: int, db: Session) -> dict:
    logs = (
        db.query(NutritionLog)
        .filter(NutritionLog.activity_id == activity_id)
        .all()
    )
    totals: dict[str, float] = {
        "calories": 0.0,
        "carbohydrates": 0.0,
        "proteins": 0.0,
        "fats": 0.0,
    }
    for log in logs:
        food = log.food
        if not food:
            continue
        factor = log.quantity_grams / 100.0
        totals["calories"] += (food.calories or 0.0) * factor
        totals["carbohydrates"] += (food.carbohydrates or 0.0) * factor
        totals["proteins"] += (food.proteins or 0.0) * factor
        totals["fats"] += (food.fats or 0.0) * factor

    return {k: round(v, 1) for k, v in totals.items()}
