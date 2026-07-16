import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/shawarma")
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
ADMIN_IDS = [int(x) for x in os.getenv("ADMIN_IDS", "").split(",") if x.strip()]
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
