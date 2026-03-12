import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings


class Base(DeclarativeBase):
    pass


def _ensure_data_dir():
    url = settings.database_url
    if url.startswith("sqlite:///"):
        path = url.replace("sqlite:///", "")
        directory = os.path.dirname(path)
        if directory:
            os.makedirs(directory, exist_ok=True)


_ensure_data_dir()

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    # Import models so SQLAlchemy registers them with Base before create_all
    from app.models import activity, food, nutrition_log  # noqa: F401
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
