from sqlalchemy import Column, String
from app.database import Base


class AppSetting(Base):
    __tablename__ = "settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=True)
