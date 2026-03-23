from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.app_setting import AppSetting

router = APIRouter(prefix="/settings", tags=["settings"])


class SettingSet(BaseModel):
    key: str
    value: str


@router.get("")
async def get_settings(db: Session = Depends(get_db)):
    rows = db.query(AppSetting).all()
    return {r.key: r.value for r in rows}


@router.post("")
async def set_setting(data: SettingSet, db: Session = Depends(get_db)):
    setting = db.query(AppSetting).filter(AppSetting.key == data.key).first()
    if setting:
        setting.value = data.value
    else:
        setting = AppSetting(key=data.key, value=data.value)
        db.add(setting)
    db.commit()
    return {"key": data.key, "value": data.value}
