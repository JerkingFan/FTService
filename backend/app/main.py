from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.migrate import run_migrations
from app.routers import admin, auth, bookings, chat, health, masters, me, parts, seller, uploads
from app.seed import seed_database
from app.uploads import ensure_upload_dir


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
    ensure_upload_dir()
    seed_database()
    yield


app = FastAPI(
    title="FTservice API",
    description="Бэкенд маркетплейса б/у запчастей и услуг мастеров (Бишкек)",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(parts.router, prefix="/api")
app.include_router(masters.router, prefix="/api")
app.include_router(bookings.router, prefix="/api")
app.include_router(me.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(seller.router, prefix="/api")
app.include_router(uploads.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

upload_path = Path(settings.upload_dir)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/api/media", StaticFiles(directory=str(upload_path)), name="media")


@app.get("/api/config")
def public_config():
    return {
        "brand": "FTservice",
        "whatsapp": settings.whatsapp_phone,
        "telegram": settings.telegram_username,
        "city": settings.city,
        "return_days": settings.return_days,
        "max_upload_files": settings.max_upload_files,
        "max_upload_size_mb": settings.max_upload_size_mb,
    }
