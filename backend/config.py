import os

# Security
SECRET_KEY = os.environ.get("SECRET_KEY", "a_default_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://ex_engine_user:a_strong_password@localhost/ex_engine_db")

# Redis
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
