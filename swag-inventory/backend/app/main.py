import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select

from .config import (ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, CORS_ORIGINS, DEFAULT_BRANCHES, DEFAULT_CHOICES,
                     UPLOAD_DIR)
from .database import Base, SessionLocal, engine
from .models import Branch, Choice, User
from .routers import assets, auth, requests, setup, users
from .security import hash_password


def seed():
    with SessionLocal() as db:
        if not db.scalar(select(func.count()).select_from(User)) and ADMIN_EMAIL and ADMIN_PASSWORD:
            db.add(User(email=ADMIN_EMAIL.strip().lower(), name=ADMIN_NAME,
                        password_hash=hash_password(ADMIN_PASSWORD), role="admin", all_branches=True))
            print(f"[seed] admin created: {ADMIN_EMAIL}")
        if not db.scalar(select(func.count()).select_from(Choice)):
            for kind, values in DEFAULT_CHOICES.items():
                for i, v in enumerate(values):
                    db.add(Choice(kind=kind, value=v, sort=i))
        if not db.scalar(select(func.count()).select_from(Branch)):
            for name in DEFAULT_BRANCHES:
                db.add(Branch(name=name, brand=name.split("-")[0].strip()))
        db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    seed()
    yield


app = FastAPI(title="SWAG Inventory API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=False,
                   allow_methods=["*"], allow_headers=["*"])

os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

for r in (auth.router, users.router, setup.router, assets.router, requests.router):
    app.include_router(r)


@app.get("/api/health")
def health():
    return {"ok": True}
