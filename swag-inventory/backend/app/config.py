import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./inventory.db")
# Railway / Heroku give postgres:// or postgresql:// — use the psycopg 3 driver we ship
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgres://"):]
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-in-production")
TOKEN_HOURS = int(os.getenv("TOKEN_HOURS", "12"))

# First admin is created automatically on startup when the users table is empty
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "")
ADMIN_NAME = os.getenv("ADMIN_NAME", "Administrator")

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "8"))
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]

DEFAULT_BRANCHES = ["اوتفيت - المدينة", "اوتفيت - البديعة", "اوتفيت - النسيم", "اوتفيت - سكاكا"]
DEFAULT_CHOICES = {
    "status": ["قيد الاستخدام", "متاح", "مخزن", "يحتاج صيانة", "تالف"],
    "category": ["الكترونيات", "كمبيوتر", "كاميرات", "هاتف", "جوال", "ديكورات", "مستلزمات", "كراسي",
                 "طاولات", "مكتب", "اثاث", "مكاتب", "طيور وقوارض", "اخرى"],
    "color": ["ابيض", "اسود", "رمادي", "اصفر", "برتقالي", "احمر", "وردي", "اخضر", "سماوي", "ازرق",
              "بنفسجي", "بني"],
}
