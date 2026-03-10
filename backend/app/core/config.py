import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import Optional, List

class Settings(BaseSettings):
    PROJECT_NAME: str = "Kuantra"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development" # development, production, test
    IS_VERCEL: bool = False
    
    # Gemini AI
    GOOGLE_API_KEY: str = ""
    LLM_MODEL: str = "gemini-2.0-flash"
    
    # Database (Async)
    DATABASE_URL: str = ""
    # Database (Sync compatibility)
    SQLALCHEMY_DATABASE_URI: str = ""
    
    # Legacy DB variables
    POSTGRES_SERVER: str = ""
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""
    
    # Auth (Clerk)
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_WEBHOOK_SECRET: str = ""
    CLERK_ISSUER: str = ""
    CLERK_JWKS_URL: str = ""
    ENCRYPTION_KEY: str = ""
    
    # SMTP Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CORS_ORIGINS: str = ""
    CORS_ALLOW_ORIGIN_REGEX: str = r"^https://.*\.vercel\.app$"
    
    # App
    DEBUG: bool = True
    PORT: int = 8000
    
    # DuckDB Enterprise Settings
    DUCKDB_DATABASE_PATH: str = "data/warehouse.duckdb"
    DUCKDB_MEMORY_LIMIT: str = "4GB"  # Fixed limit to avoid parser errors with %
    DUCKDB_TEMP_DIR: str = "data/duckdb_temp"
    UPLOAD_DIR: str = "uploads"
    DUCKDB_THREADS: int = 4
    DUCKDB_PRESERVE_ORDER: bool = False  # Memory optimization
    BRONZE_BASE_PATH: str = "data/bronze"
    
    # ETL Settings
    ETL_MAX_CONCURRENT_SYNCS: int = 3
    ETL_DEFAULT_BATCH_SIZE: int = 10000
    ETL_RETRY_ATTEMPTS: int = 3
    ETL_RETRY_DELAY_SECONDS: int = 30
    
    # Sync Settings
    DEFAULT_SYNC_INTERVAL_MINUTES: int = 60
    MIN_SYNC_INTERVAL_MINUTES: int = 5
    
    # ETL Batching Settings (for large table handling)
    ETL_TABLES_PER_BATCH: int = 5  # Process 5 tables at a time
    ETL_LARGE_TABLE_THRESHOLD: int = 100000  # Tables with >100K rows get special handling
    ETL_FETCH_SIZE_LARGE: int = 200  # For tables >100K rows
    ETL_FETCH_SIZE_MEDIUM: int = 500  # For tables 10K-100K rows
    ETL_FETCH_SIZE_SMALL: int = 1000  # For tables <10K rows
    ETL_CHUNK_TIMEOUT_SECONDS: int = 30  # Timeout per fetch operation

    # Query safety/timeouts
    EXTERNAL_QUERY_TIMEOUT_SECONDS: int = 30
    ANALYTICAL_QUERY_TIMEOUT_SECONDS: int = 30

    # LLM provider selection
    AI_PROVIDER: str = "gemini"  # gemini | local
    ALLOW_CLOUD_LLM: bool = True
    LOCAL_LLM_BASE_URL: str = ""
    LOCAL_LLM_MODEL: str = "local-model"
    LOCAL_LLM_API_KEY: str = ""
    
    @model_validator(mode='after')
    def assemble_db_urls(self):
        # Detect Vercel
        self.IS_VERCEL = os.environ.get("VERCEL") == "1"
        if self.IS_VERCEL:
            self.ENVIRONMENT = "production"
            # In Vercel, we MUST use /tmp for any write operations
            self.DUCKDB_DATABASE_PATH = "/tmp/warehouse.duckdb"
            self.DUCKDB_TEMP_DIR = "/tmp/duckdb_temp"
            self.UPLOAD_DIR = "/tmp/uploads"
            self.BRONZE_BASE_PATH = "/tmp/bronze"
            
        # Ensure directories exist (only for non-vercel or if possible)
        if not self.IS_VERCEL:
            for d in [os.path.dirname(self.DUCKDB_DATABASE_PATH), self.DUCKDB_TEMP_DIR, self.UPLOAD_DIR, self.BRONZE_BASE_PATH]:
                if d and not os.path.exists(d):
                    os.makedirs(d, exist_ok=True)
        else:
             # In Vercel, we can try to create them in /tmp
             for d in [os.path.dirname(self.DUCKDB_DATABASE_PATH), self.DUCKDB_TEMP_DIR, self.UPLOAD_DIR, self.BRONZE_BASE_PATH]:
                if d and not os.path.exists(d):
                    try:
                        os.makedirs(d, exist_ok=True)
                    except:
                        pass

        # Handle construction from separate Postgres parts if URI is missing
        if not self.SQLALCHEMY_DATABASE_URI and self.POSTGRES_SERVER:
            self.SQLALCHEMY_DATABASE_URI = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
            
        if not self.DATABASE_URL and self.SQLALCHEMY_DATABASE_URI:
            # If only sync URI provided, try to make it async if postgres
            if "postgresql://" in self.SQLALCHEMY_DATABASE_URI:
                self.DATABASE_URL = self.SQLALCHEMY_DATABASE_URI.replace("postgresql://", "postgresql+asyncpg://")
            else:
                self.DATABASE_URL = self.SQLALCHEMY_DATABASE_URI
        
        if not self.SQLALCHEMY_DATABASE_URI and self.DATABASE_URL:
            # If only async URL provided, make sync one
            self.SQLALCHEMY_DATABASE_URI = self.DATABASE_URL.replace("+asyncpg", "")

        provider = (self.AI_PROVIDER or "gemini").lower()

        if provider not in {"gemini", "local"}:
            raise ValueError("AI_PROVIDER must be either 'gemini' or 'local'.")

        if not self.ALLOW_CLOUD_LLM and provider == "gemini":
            raise ValueError(
                "Invalid config: ALLOW_CLOUD_LLM is false but AI_PROVIDER is 'gemini'. "
                "Set AI_PROVIDER='local' for no-egress mode."
            )

        if provider == "local" and not self.LOCAL_LLM_BASE_URL:
            raise ValueError("LOCAL_LLM_BASE_URL must be set when AI_PROVIDER='local'.")

        if self.CLERK_ISSUER and not self.CLERK_JWKS_URL:
            self.CLERK_JWKS_URL = f"{self.CLERK_ISSUER.rstrip('/')}/.well-known/jwks.json"

        # Use an explicit encryption key for secrets-at-rest (DB passwords, SSH creds).
        if not self.ENCRYPTION_KEY:
            self.ENCRYPTION_KEY = self.CLERK_SECRET_KEY or "local-dev-encryption-key"

        is_production = (self.ENVIRONMENT or "").lower() == "production"
        if is_production and self.ENCRYPTION_KEY == "local-dev-encryption-key":
            raise ValueError("ENCRYPTION_KEY must be set in production.")
        if is_production and not (self.CLERK_ISSUER or self.CLERK_JWKS_URL):
            raise ValueError("CLERK_ISSUER or CLERK_JWKS_URL must be set in production.")
            
        return self

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        extra="ignore"
)
settings = Settings()
