from sqlalchemy import Column, Integer, String
from app.database import Base


class Season(Base):
    __tablename__ = "seasons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    year = Column(Integer, nullable=True)
    season_type = Column(String, nullable=True)
    start_date = Column(String, nullable=False)  # YYYY-MM-DD
    end_date = Column(String, nullable=False)     # YYYY-MM-DD
    notes = Column(String, nullable=True)
