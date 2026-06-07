from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    secret_key: str = "dev-secret-change-in-production"
    database_url: str = "sqlite:///./ftservice.db"
    cors_origins: str = (
        "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5500,"
        "http://127.0.0.1:5500,http://localhost:19006,exp://127.0.0.1:19000,"
        "exp://localhost:19000,null,*"
    )
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    whatsapp_phone: str = "996700000000"
    telegram_username: str = "ftservice_kg"
    city: str = "Бишкек"
    return_days: int = 3
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 8
    max_upload_files: int = 10
    public_base_url: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
