import uuid
import math
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, text

from app.database import get_db
from app.models.activity import Activity
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.activity import (
    ActivityListResponse,
    AdminActivityResponse,
    AdminActivityListResponse,
    AdminActivitySummaryItem,
    AdminActivitySummaryResponse,
)
from app.schemas.audit import AuditLogResponse, AuditLogListResponse
from app.schemas.user import UserResponse, UserUpdate
from app.services.audit_service import log_action
from app.dependencies import require_admin

router = APIRouter()


@router.get("/activities", response_model=AdminActivityListResponse)
async def list_all_activities(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    search: str | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
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
        select(Activity, User.full_name, User.email)
        .join(User, Activity.user_id == User.id)
        .where(where)
        .order_by(Activity.date.desc(), Activity.start_time.desc())
        .offset(offset)
        .limit(page_size)
    )
    rows = result.all()

    items = [
        AdminActivityResponse(
            id=row[0].id,
            user_id=row[0].user_id,
            name=row[0].name,
            date=row[0].date,
            start_time=row[0].start_time,
            end_time=row[0].end_time,
            tags=row[0].tags,
            observations=row[0].observations,
            created_at=row[0].created_at,
            updated_at=row[0].updated_at,
            user_full_name=row[1],
            user_email=row[2],
        )
        for row in rows
    ]

    return AdminActivityListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )


@router.get("/activities/summary", response_model=AdminActivitySummaryResponse)
async def list_activity_summary(
    date_from: date | None = Query(None, description="Fecha inicio YYYY-MM-DD"),
    date_to: date | None = Query(None, description="Fecha fin YYYY-MM-DD"),
    group_by: str = Query("day", pattern="^(day|week|month)$"),
    user_id: uuid.UUID | None = Query(None, description="Filtrar por usuario"),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    today = date.today()
    if not date_from:
        date_from = today - timedelta(days=30)
    if not date_to:
        date_to = today

    filters = [
        Activity.date >= date_from,
        Activity.date <= date_to,
    ]
    if user_id:
        filters.append(Activity.user_id == user_id)

    where = and_(*filters)

    duration_sec = func.timestampdiff(text("SECOND"), Activity.start_time, Activity.end_time)

    if group_by == "week":
        period_expr = func.date_format(Activity.date, "%x-W%v").label("period")
    elif group_by == "month":
        period_expr = func.date_format(Activity.date, "%Y-%m").label("period")
    else:
        period_expr = func.date_format(Activity.date, "%Y-%m-%d").label("period")

    query = (
        select(
            Activity.user_id,
            User.full_name,
            period_expr,
            func.sum(duration_sec).label("total_seconds"),
            func.count().label("count"),
        )
        .join(User, Activity.user_id == User.id)
        .where(where)
        .group_by(Activity.user_id, User.full_name, period_expr)
        .order_by(Activity.user_id, period_expr)
    )

    result = await db.execute(query)
    rows = result.all()

    items = [
        AdminActivitySummaryItem(
            user_id=row.user_id,
            user_full_name=row.full_name,
            period=row.period,
            total_hours=round((row.total_seconds or 0) / 3600, 2),
            count=row.count,
        )
        for row in rows
    ]

    total_hours = round(sum(item.total_hours for item in items), 2)

    return AdminActivitySummaryResponse(
        items=items,
        total_hours=total_hours,
        group_by=group_by,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/users", response_model=list[UserResponse])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    changes = []
    for field, value in data.model_dump(exclude_none=True).items():
        old = getattr(user, field)
        if old != value:
            changes.append(f"{field}: {old} -> {value}")
        setattr(user, field, value)
    await db.flush()

    if changes:
        await log_action(
            db, "ADMIN_UPDATE_USER", "user",
            user_id=admin.id,
            entity_id=user.id,
            details="; ".join(changes),
        )

    return user


@router.get("/logs", response_model=AuditLogListResponse)
async def list_audit_logs(
    user_id: uuid.UUID | None = Query(None),
    action: str | None = Query(None),
    entity_type: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    filters = []
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if action:
        filters.append(AuditLog.action == action)
    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)

    where = and_(*filters) if filters else True

    total_q = await db.execute(select(func.count()).select_from(AuditLog).where(where))
    total = total_q.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(
        select(AuditLog)
        .where(where)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    items = result.scalars().all()

    return AuditLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total else 0,
    )
