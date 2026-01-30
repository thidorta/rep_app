from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    database_url: str = "sqlite:///database.db"
    # Carrega automaticamente do arquivo .env
    model_config = SettingsConfigDict(env_file=ENV_PATH)

settings = Settings()