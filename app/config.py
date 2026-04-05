from pydantic_settings import BaseSettings

APP_VERSION = "0.4.3"


class Settings(BaseSettings):
    strava_client_id: str = ""
    strava_client_secret: str = ""
    strava_redirect_uri: str = "http://localhost:8000/auth/callback"
    database_url: str = "sqlite:///./data/intaketracking.db"
    secret_key: str = "changeme_generate_a_real_one"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
