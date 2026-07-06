from typing import List, Union

from pydantic import AnyHttpUrl, root_validator, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Progression Tracker API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # 'development', 'production', 'testing'
    
    # BACKEND_CORS_ORIGINS is a JSON-formatted list of origins
    # e.g: '["http://localhost", "http://localhost:4200", "http://localhost:3000"]'
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "progression"
    SQLALCHEMY_DATABASE_URI: str = ""

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: str, values: dict[str, str]) -> str:
        if isinstance(v, str) and v != "":
            return v
        return f"postgresql+asyncpg://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_SERVER')}/{values.get('POSTGRES_DB')}"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # JWT Authentication
    SECRET_KEY: str = "SUPER_SECRET_KEY_PLEASE_CHANGE"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    @root_validator(skip_on_failure=True)
    def validate_secrets(cls, values: dict[str, any]) -> dict[str, any]:
        env = values.get("ENVIRONMENT", "development")
        secret_key = values.get("SECRET_KEY", "SUPER_SECRET_KEY_PLEASE_CHANGE")
        if env == "production" and secret_key == "SUPER_SECRET_KEY_PLEASE_CHANGE":
            raise ValueError("SECRET_KEY must be changed in production environments")
        return values

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
