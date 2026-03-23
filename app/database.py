import os
from sqlalchemy import create_engine, text
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
    from app.models import activity, food, nutrition_log, season, app_setting  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _migrate_db()


def _migrate_db():
    """Add new columns to existing tables without dropping data (SQLite safe migration)."""
    new_columns = [
        ("activities", "average_watts", "REAL"),
        ("activities", "weighted_average_watts", "REAL"),
        ("activities", "max_watts", "REAL"),
        ("foods", "serving_grams", "REAL"),
        ("seasons", "year", "INTEGER"),
    ]
    with engine.connect() as conn:
        for table, col, col_type in new_columns:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}"))
                conn.commit()
            except Exception:
                pass  # Column already exists

        # Create seasons table if not exists (for legacy DBs pre-SQLAlchemy create_all)
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS seasons ("
            "id INTEGER PRIMARY KEY AUTOINCREMENT, "
            "name TEXT NOT NULL, "
            "year INTEGER, "
            "season_type TEXT, "
            "start_date TEXT NOT NULL, "
            "end_date TEXT NOT NULL"
            ")"
        ))
        conn.commit()

        # Create settings table
        conn.execute(text(
            "CREATE TABLE IF NOT EXISTS settings ("
            "key TEXT PRIMARY KEY, "
            "value TEXT"
            ")"
        ))
        conn.commit()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
