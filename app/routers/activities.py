import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, exists
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.activity import Activity
from app.models.app_setting import AppSetting
from app.models.food import Food
from app.models.nutrition_log import NutritionLog
from app.models.season import Season
from app.services.nutrition_service import get_activity_nutrition_summary


def _get_excluded_types(db: Session) -> list[str]:
    row = db.query(AppSetting).filter(AppSetting.key == "excluded_activity_types").first()
    if row and row.value:
        try:
            return json.loads(row.value)
        except (json.JSONDecodeError, TypeError):
            pass
    return []

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("/stats")
async def get_stats(
    db: Session = Depends(get_db),
    season_id: int = Query(None),
):
    # Resolve season date range if requested
    season_start: str | None = None
    season_end: str | None = None
    if season_id is not None:
        season = db.query(Season).filter(Season.id == season_id).first()
        if not season:
            raise HTTPException(status_code=404, detail="Season not found")
        season_start = season.start_date
        season_end = season.end_date

    excluded_types = _get_excluded_types(db)

    def _season_filter(q):
        if season_start and season_end:
            q = q.filter(
                func.date(Activity.start_date) >= season_start,
                func.date(Activity.start_date) <= season_end,
            )
        if excluded_types:
            q = q.filter(Activity.sport_type.notin_(excluded_types))
        return q

    total_activities = _season_filter(db.query(func.count(Activity.id))).scalar() or 0
    total_distance = _season_filter(db.query(func.sum(Activity.distance))).scalar() or 0.0
    total_calories = _season_filter(db.query(func.sum(Activity.calories))).scalar() or 0.0
    total_foods = db.query(func.count(Food.id)).scalar() or 0
    tracked_activities = (
        _season_filter(
            db.query(func.count(Activity.id))
            .filter(exists().where(NutritionLog.activity_id == Activity.id))
        ).scalar() or 0
    )

    # Consumed nutrition — filtered by season via NutritionLog → Activity join
    nutrition_base = (
        db.query(NutritionLog)
        .join(Activity, NutritionLog.activity_id == Activity.id)
    )
    if season_start and season_end:
        nutrition_base = nutrition_base.filter(
            func.date(Activity.start_date) >= season_start,
            func.date(Activity.start_date) <= season_end,
        )

    kcal_consumed = (
        db.query(func.sum(Food.calories * NutritionLog.quantity_grams / 100.0))
        .select_from(NutritionLog)
        .join(Food, NutritionLog.food_id == Food.id)
        .join(Activity, NutritionLog.activity_id == Activity.id)
        .filter(*(
            [
                func.date(Activity.start_date) >= season_start,
                func.date(Activity.start_date) <= season_end,
            ] if season_start else []
        ))
        .scalar() or 0.0
    )
    carbs_consumed = (
        db.query(func.sum(Food.carbohydrates * NutritionLog.quantity_grams / 100.0))
        .select_from(NutritionLog)
        .join(Food, NutritionLog.food_id == Food.id)
        .join(Activity, NutritionLog.activity_id == Activity.id)
        .filter(*(
            [
                func.date(Activity.start_date) >= season_start,
                func.date(Activity.start_date) <= season_end,
            ] if season_start else []
        ))
        .scalar() or 0.0
    )
    sugars_consumed = (
        db.query(func.sum(Food.sugars * NutritionLog.quantity_grams / 100.0))
        .select_from(NutritionLog)
        .join(Food, NutritionLog.food_id == Food.id)
        .join(Activity, NutritionLog.activity_id == Activity.id)
        .filter(*(
            [
                func.date(Activity.start_date) >= season_start,
                func.date(Activity.start_date) <= season_end,
            ] if season_start else []
        ))
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


@router.get("/types")
async def get_activity_types(db: Session = Depends(get_db)):
    """Distinct activity types for settings filters."""
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
    season_id: int = Query(None),
):
    query = db.query(Activity)

    if sport_type:
        query = query.filter(Activity.sport_type == sport_type)

    if tracked == "yes":
        query = query.filter(exists().where(NutritionLog.activity_id == Activity.id))
    elif tracked == "no":
        query = query.filter(~exists().where(NutritionLog.activity_id == Activity.id))

    if season_id is not None:
        season = db.query(Season).filter(Season.id == season_id).first()
        if not season:
            raise HTTPException(status_code=404, detail="Season not found")
        query = query.filter(
            func.date(Activity.start_date) >= season.start_date,
            func.date(Activity.start_date) <= season.end_date,
        )

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

    all_seasons = db.query(Season).all()

    def _find_season_name(act: Activity) -> str | None:
        if not act.start_date:
            return None
        date_str = act.start_date.strftime("%Y-%m-%d")
        for s in all_seasons:
            if s.start_date <= date_str <= s.end_date:
                return s.name
        return None

    return {
        "total": total,
        "items": [
            {**_activity_dict(a, a.id in ids_with_nutrition), "season_name": _find_season_name(a)}
            for a in activities
        ],
    }


@router.get("/graphs")
async def get_graphs(
    db: Session = Depends(get_db),
    season_id: int = Query(None),
):
    from collections import defaultdict

    query = db.query(Activity).filter(Activity.start_date.isnot(None))

    if season_id is not None:
        season = db.query(Season).filter(Season.id == season_id).first()
        if not season:
            raise HTTPException(status_code=404, detail="Season not found")
        query = query.filter(
            func.date(Activity.start_date) >= season.start_date,
            func.date(Activity.start_date) <= season.end_date,
        )

    excluded = _get_excluded_types(db)
    if excluded:
        query = query.filter(Activity.sport_type.notin_(excluded))

    activities = query.order_by(Activity.start_date).all()

    monthly: dict = defaultdict(lambda: {"activity_count": 0, "total_distance_km": 0.0})
    for act in activities:
        month_key = act.start_date.strftime("%Y-%m")
        monthly[month_key]["activity_count"] += 1
        monthly[month_key]["total_distance_km"] = round(
            monthly[month_key]["total_distance_km"] + (act.distance or 0) / 1000, 2
        )

    return [{"month": k, **v} for k, v in sorted(monthly.items())]


@router.get("/graphs/nutrition")
async def get_nutrition_graphs(
    db: Session = Depends(get_db),
    season_id: int = Query(None),
):
    excluded = _get_excluded_types(db)

    season_start: str | None = None
    season_end: str | None = None
    if season_id is not None:
        season = db.query(Season).filter(Season.id == season_id).first()
        if not season:
            raise HTTPException(status_code=404, detail="Season not found")
        season_start = season.start_date
        season_end = season.end_date

    nutrition_agg = (
        db.query(
            NutritionLog.activity_id,
            func.sum(Food.calories * NutritionLog.quantity_grams / 100.0).label("kcal_consumed"),
            func.sum(Food.carbohydrates * NutritionLog.quantity_grams / 100.0).label("carbs_grams"),
            func.sum(Food.proteins * NutritionLog.quantity_grams / 100.0).label("protein_grams"),
            func.sum(Food.fats * NutritionLog.quantity_grams / 100.0).label("fat_grams"),
            func.sum(Food.sugars * NutritionLog.quantity_grams / 100.0).label("sugar_grams"),
        )
        .join(Food, NutritionLog.food_id == Food.id)
        .group_by(NutritionLog.activity_id)
        .subquery()
    )

    query = (
        db.query(
            Activity.id,
            Activity.name,
            Activity.sport_type,
            Activity.start_date,
            Activity.moving_time,
            Activity.calories,
            nutrition_agg.c.kcal_consumed,
            nutrition_agg.c.carbs_grams,
            nutrition_agg.c.protein_grams,
            nutrition_agg.c.fat_grams,
            nutrition_agg.c.sugar_grams,
        )
        .join(nutrition_agg, Activity.id == nutrition_agg.c.activity_id)
    )

    if season_start and season_end:
        query = query.filter(
            func.date(Activity.start_date) >= season_start,
            func.date(Activity.start_date) <= season_end,
        )

    if excluded:
        query = query.filter(Activity.sport_type.notin_(excluded))

    rows = query.order_by(Activity.start_date).all()

    return [
        {
            "id": row.id,
            "name": row.name,
            "sport_type": row.sport_type,
            "start_date": row.start_date.isoformat() if row.start_date else None,
            "duration_seconds": row.moving_time or 0,
            "kilojoules": row.calories or 0,
            "kcal_consumed": round(row.kcal_consumed or 0, 1),
            "carbs_grams": round(row.carbs_grams or 0, 1),
            "protein_grams": round(row.protein_grams or 0, 1),
            "fat_grams": round(row.fat_grams or 0, 1),
            "sugar_grams": round(row.sugar_grams or 0, 1),
        }
        for row in rows
    ]


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

    # Find which season this activity belongs to
    season = None
    if activity.start_date:
        date_str = activity.start_date.strftime("%Y-%m-%d")
        matched = db.query(Season).filter(
            Season.start_date <= date_str,
            Season.end_date >= date_str,
        ).first()
        if matched:
            season = {"id": matched.id, "name": matched.name, "season_type": matched.season_type}
    data["season"] = season
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
