from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, exists
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity import Activity
from app.models.food import Food
from app.models.nutrition_log import NutritionLog
from app.services.nutrition_service import get_activity_nutrition_summary

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    total_activities = db.query(func.count(Activity.id)).scalar() or 0
    total_distance = db.query(func.sum(Activity.distance)).scalar() or 0.0
    total_calories = db.query(func.sum(Activity.calories)).scalar() or 0.0
    total_foods = db.query(func.count(Food.id)).scalar() or 0
    tracked_activities = (
        db.query(func.count(Activity.id))
        .filter(exists().where(NutritionLog.activity_id == Activity.id))
        .scalar() or 0
    )

    # Consumed nutrition (only from activities with food logs)
    kcal_consumed = (
        db.query(func.sum(Food.calories * NutritionLog.quantity_grams / 100.0))
        .select_from(NutritionLog)
        .join(Food, NutritionLog.food_id == Food.id)
        .scalar() or 0.0
    )
    carbs_consumed = (
        db.query(func.sum(Food.carbohydrates * NutritionLog.quantity_grams / 100.0))
        .select_from(NutritionLog)
        .join(Food, NutritionLog.food_id == Food.id)
        .scalar() or 0.0
    )
    sugars_consumed = (
        db.query(func.sum(Food.sugars * NutritionLog.quantity_grams / 100.0))
        .select_from(NutritionLog)
        .join(Food, NutritionLog.food_id == Food.id)
        .scalar() or 0.0
    )

    avg_kcal = round(kcal_consumed / tracked_activities, 1) if tracked_activities > 0 else 0.0
    avg_carbs = round(carbs_consumed / tracked_activities, 1) if tracked_activities > 0 else 0.0
    avg_sugars = round(sugars_consumed / tracked_activities, 1) if tracked_activities > 0 else 0.0

    return {
        "total_activities": total_activities,
        "tracked_activities": tracked_activities,
        "total_distance_km": round(total_distance / 1000, 1),
        "total_calories_burned": round(total_calories, 0),
        "total_foods": total_foods,
        "total_kcal_consumed": round(kcal_consumed, 0),
        "avg_kcal_consumed": avg_kcal,
        "total_carbs_consumed": round(carbs_consumed, 1),
        "avg_carbs_consumed": avg_carbs,
        "total_sugars_consumed": round(sugars_consumed, 1),
        "avg_sugars_consumed": avg_sugars,
    }


@router.get("/sport_types")
async def get_sport_types(db: Session = Depends(get_db)):
    rows = (
        db.query(Activity.sport_type)
        .filter(Activity.sport_type.isnot(None), Activity.sport_type != "")
        .distinct()
        .all()
    )
    return sorted([r[0] for r in rows])


@router.get("")
async def list_activities(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sport_type: str = Query(None),
    tracked: str = Query(None),  # "yes" | "no" | None
):
    query = db.query(Activity)

    if sport_type:
        query = query.filter(Activity.sport_type == sport_type)

    if tracked == "yes":
        query = query.filter(exists().where(NutritionLog.activity_id == Activity.id))
    elif tracked == "no":
        query = query.filter(~exists().where(NutritionLog.activity_id == Activity.id))

    total = query.with_entities(func.count(Activity.id)).scalar() or 0
    activities = query.order_by(Activity.start_date.desc()).offset(skip).limit(limit).all()

    activity_ids = [a.id for a in activities]
    ids_with_nutrition: set = set()
    if activity_ids:
        ids_with_nutrition = {
            row[0] for row in db.query(NutritionLog.activity_id)
            .filter(NutritionLog.activity_id.in_(activity_ids))
            .distinct()
            .all()
        }
    return {
        "total": total,
        "items": [_activity_dict(a, a.id in ids_with_nutrition) for a in activities],
    }


@router.get("/{activity_id}")
async def get_activity(activity_id: int, db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    has_nutrition = (
        db.query(NutritionLog).filter(NutritionLog.activity_id == activity_id).first() is not None
    )
    data = _activity_dict(activity, has_nutrition)
    data["nutrition_summary"] = get_activity_nutrition_summary(activity_id, db)
    return data


def _activity_dict(a: Activity, has_nutrition: bool = False) -> dict:
    return {
        "id": a.id,
        "strava_id": a.strava_id,
        "name": a.name,
        "sport_type": a.sport_type,
        "start_date": a.start_date.isoformat() if a.start_date else None,
        "distance": a.distance,
        "moving_time": a.moving_time,
        "elapsed_time": a.elapsed_time,
        "total_elevation_gain": a.total_elevation_gain,
        "calories": a.calories,
        "description": a.description,
        "average_watts": a.average_watts,
        "weighted_average_watts": a.weighted_average_watts,
        "max_watts": a.max_watts,
        "strava_url": f"https://www.strava.com/activities/{a.strava_id}",
        "has_nutrition": has_nutrition,
    }
