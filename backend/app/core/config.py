from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Jeevith Gardens Management System"
    ENVIRONMENT: str = "development"

    DATABASE_URL: str

    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    FRONTEND_ORIGIN: str = "http://localhost:5173"

    STORAGE_PATH: str = "./storage/invoices"

    OTP_PROVIDER_API_KEY: str = ""
    OTP_PROVIDER_SECRET: str = ""
    OTP_PROVIDER_URL: str = ""

    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    OTP_RESEND_COOLDOWN_SECONDS: int = 60

    INVOICE_RETENTION_DAYS: int = 90

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()