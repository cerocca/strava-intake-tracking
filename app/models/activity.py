from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    strava_id = Column(Integer, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    sport_type = Column(String, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    distance = Column(Float, default=0.0)        # meters
    moving_time = Column(Integer, default=0)     # seconds
    elapsed_time = Column(Integer, default=0)    # seconds
    total_elevation_gain = Column(Float, default=0.0)
    calories = Column(Float, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    nutrition_logs = relationship(
        "NutritionLog",
        back_populates="activity",
        cascade="all, delete-orphan",
    )
