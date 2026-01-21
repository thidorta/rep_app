from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    database_url: str = "sqlite:///database.db"
    # Carrega automaticamente do arquivo .env
    model_config = SettingsConfigDict(env_file="../.env")

settings = Settings()