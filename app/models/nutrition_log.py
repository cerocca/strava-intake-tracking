from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class NutritionLog(Base):
    __tablename__ = "nutrition_logs"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=False)
    quantity_grams = Column(Float, nullable=False)
    consumed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    activity = relationship("Activity", back_populates="nutrition_logs")
    food = relationship("Food", back_populates="nutrition_logs")
