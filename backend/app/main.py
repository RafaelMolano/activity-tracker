from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.config import get_settings
from app.database import create_tables
from app.routers import auth, activities, admin
from app.seed import seed_admin

settings = get_settings()

app = FastAPI(
    title="Activity Tracker API",
    description="Sistema de registro de actividades diarias",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(activities.router, prefix="/api/activities", tags=["Actividades"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administración"])


@app.on_event("startup")
async def startup():
    logger.info("Iniciando Activity Tracker API...")
    await create_tables()
    logger.info("Tablas verificadas/creadas.")
    await seed_admin()


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "env": settings.APP_ENV}
