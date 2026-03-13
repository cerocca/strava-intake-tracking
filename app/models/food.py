from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    brand = Column(String, nullable=True)
    calories = Column(Float, nullable=False)        # kcal per 100 g
    carbohydrates = Column(Float, nullable=True)    # g per 100 g
    sugars = Column(Float, nullable=True)
    proteins = Column(Float, nullable=True)
    fibers = Column(Float, nullable=True)
    fats = Column(Float, nullable=True)
    saturated_fats = Column(Float, nullable=True)
    salt = Column(Float, nullable=True)
    serving_grams = Column(Float, nullable=True)  # grams per serving (suggestion only)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    nutrition_logs = relationship("NutritionLog", back_populates="food", cascade="all, delete-orphan")
