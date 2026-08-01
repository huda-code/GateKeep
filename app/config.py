from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./gatekeep.db"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"
    demo_admin_email: str = "admin@gatekeep.demo"
    demo_admin_password: str = "admin123"
    demo_auth_token: str = "gatekeep-demo-token-2026"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

settings = Settings()
