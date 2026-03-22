from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.season import Season

router = APIRouter(prefix="/seasons", tags=["seasons"])


class SeasonCreate(BaseModel):
    name: str
    season_type: str | None = None
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD


class SeasonUpdate(BaseModel):
    name: str
    season_type: str | None = None
    start_date: str
    end_date: str


def _check_overlap(db: Session, start: str, end: str, exclude_id: int | None = None) -> Season | None:
    """Return an overlapping season if any, else None."""
    query = db.query(Season).filter(
        Season.start_date <= end,
        Season.end_date >= start,
    )
    if exclude_id is not None:
        query = query.filter(Season.id != exclude_id)
    return query.first()


def _season_dict(s: Season) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "season_type": s.season_type,
        "start_date": s.start_date,
        "end_date": s.end_date,
    }


@router.get("")
async def list_seasons(db: Session = Depends(get_db)):
    seasons = db.query(Season).order_by(Season.start_date.desc()).all()
    return [_season_dict(s) for s in seasons]


@router.post("", status_code=201)
async def create_season(data: SeasonCreate, db: Session = Depends(get_db)):
    if data.start_date > data.end_date:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date")
    overlap = _check_overlap(db, data.start_date, data.end_date)
    if overlap:
        raise HTTPException(
            status_code=400,
            detail=f"Le date si sovrappongono con la stagione '{overlap.name}' ({overlap.start_date} → {overlap.end_date})"
        )
    season = Season(
        name=data.name,
        season_type=data.season_type,
        start_date=data.start_date,
        end_date=data.end_date,
    )
    db.add(season)
    db.commit()
    db.refresh(season)
    return _season_dict(season)


@router.put("/{season_id}")
async def update_season(season_id: int, data: SeasonUpdate, db: Session = Depends(get_db)):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    if data.start_date > data.end_date:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date")
    overlap = _check_overlap(db, data.start_date, data.end_date, exclude_id=season_id)
    if overlap:
        raise HTTPException(
            status_code=400,
            detail=f"Le date si sovrappongono con la stagione '{overlap.name}' ({overlap.start_date} → {overlap.end_date})"
        )
    season.name = data.name
    season.season_type = data.season_type
    season.start_date = data.start_date
    season.end_date = data.end_date
    db.commit()
    db.refresh(season)
    return _season_dict(season)


@router.delete("/{season_id}", status_code=204)
async def delete_season(season_id: int, db: Session = Depends(get_db)):
    season = db.query(Season).filter(Season.id == season_id).first()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    db.delete(season)
    db.commit()
