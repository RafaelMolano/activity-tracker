import asyncio
import uuid

from loguru import logger
from sqlalchemy import select

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.services.auth_service import hash_password

settings = get_settings()


async def seed_admin() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.email == settings.FIRST_ADMIN_EMAIL)
        )
        existing = result.scalar_one_or_none()

        if existing:
            logger.info(f"Usuario admin ya existe: {settings.FIRST_ADMIN_EMAIL}")
            return

        admin = User(
            id=uuid.uuid4(),
            email=settings.FIRST_ADMIN_EMAIL,
            hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
            full_name=settings.FIRST_ADMIN_NAME,
            role=UserRole.admin,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        logger.info(f"Usuario admin creado: {settings.FIRST_ADMIN_EMAIL}")


if __name__ == "__main__":
    asyncio.run(seed_admin())
