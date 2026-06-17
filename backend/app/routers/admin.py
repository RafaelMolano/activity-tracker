import uuid
import math
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import ActivityListResponse
from app.schemas.user import UserResponse, UserUpdate
from app.dependencies import require_admin

router = APIRouter()


@router.get("/activities", response_model=ActivityListResponse)
async def list_all_activities(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    search: str | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    filters = []
    if date_from:
        filters.append(Activity.date >= date_from)
    if date_to:
        filters.append(Activity.date <= date_to)
    if search:
        filters.append(Activity.name.ilike(f"%{search}%"))
    if user_id:
        filters.append(Activity.user_id == user_id)

    where = and_(*filters) if filters else True

    total_q = await db.execute(select(func.count()).select_from(Activity).where(where))
    total = total_q.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(
        select(Activity)
        .where(where)
        .order_by(Activity.date.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = result.scalars().all()

    return ActivityListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.flush()
    return user
