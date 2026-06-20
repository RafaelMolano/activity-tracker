import uuid
import math
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text

from app.database import get_db
from app.models.activity import Activity
from app.models.user import User
from app.schemas.activity import (
    ActivityCreate, ActivityUpdate, ActivityResponse,
    ActivityListResponse, ActivityStatsResponse, ActivityStatsItem,
)
from app.dependencies import get_current_user

router = APIRouter()


@router.get("/", response_model=ActivityListResponse)
async def list_activities(
    date_from: date | None = Query(None, description="Fecha inicio YYYY-MM-DD"),
    date_to: date | None = Query(None, description="Fecha fin YYYY-MM-DD"),
    search: str | None = Query(None, description="Buscar en nombre"),
    tags: str | None = Query(None, description="Tags separados por coma"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = [Activity.user_id == current_user.id]

    if date_from:
        filters.append(Activity.date >= date_from)
    if date_to:
        filters.append(Activity.date <= date_to)
    if search:
        filters.append(Activity.name.ilike(f"%{search}%"))
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(",")]
        from sqlalchemy import or_
        filters.append(or_(*(
            func.json_contains(Activity.tags, func.json_quote(tag)) == 1
            for tag in tag_list
        )))

    total_q = await db.execute(select(func.count()).select_from(Activity).where(and_(*filters)))
    total = total_q.scalar()

    offset = (page - 1) * page_size
    result = await db.execute(
        select(Activity)
        .where(and_(*filters))
        .order_by(Activity.date.desc(), Activity.start_time.desc())
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


@router.post("/", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(
    data: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = Activity(**data.model_dump(), user_id=current_user.id)
    db.add(activity)
    await db.flush()
    await db.refresh(activity)
    return activity


@router.get("/stats", response_model=ActivityStatsResponse)
async def activity_stats(
    date_from: date | None = Query(None, description="Fecha inicio YYYY-MM-DD"),
    date_to: date | None = Query(None, description="Fecha fin YYYY-MM-DD"),
    group_by: str = Query("day", pattern="^(day|week|month)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()
    if not date_from:
        date_from = today - timedelta(days=today.weekday())
    if not date_to:
        date_to = today

    filters = [
        Activity.user_id == current_user.id,
        Activity.date >= date_from,
        Activity.date <= date_to,
    ]

    duration_sec = func.timestampdiff(text("SECOND"), Activity.start_time, Activity.end_time)

    if group_by == "week":
        period_expr = func.date_format(Activity.date, "%x-W%v").label("period")
    elif group_by == "month":
        period_expr = func.date_format(Activity.date, "%Y-%m").label("period")
    else:
        period_expr = func.date_format(Activity.date, "%Y-%m-%d").label("period")

    query = (
        select(
            period_expr,
            func.sum(duration_sec).label("total_seconds"),
            func.count().label("count"),
        )
        .where(and_(*filters))
        .group_by(period_expr)
        .order_by(period_expr)
    )

    result = await db.execute(query)
    rows = result.all()

    items = [
        ActivityStatsItem(
            period=row.period,
            total_hours=round((row.total_seconds or 0) / 3600, 2),
            count=row.count,
        )
        for row in rows
    ]

    total_hours = round(sum(item.total_hours for item in items), 2)

    return ActivityStatsResponse(
        items=items,
        total_hours=total_hours,
        group_by=group_by,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/{activity_id}", response_model=ActivityResponse)
async def get_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Activity).where(
            and_(Activity.id == activity_id, Activity.user_id == current_user.id)
        )
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    return activity


@router.put("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: uuid.UUID,
    data: ActivityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Activity).where(
            and_(Activity.id == activity_id, Activity.user_id == current_user.id)
        )
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(activity, field, value)

    # Revalidar horas si se actualizaron ambas
    start = data.start_time or activity.start_time
    end = data.end_time or activity.end_time
    if end <= start:
        raise HTTPException(
            status_code=400, detail="La hora de fin debe ser posterior a la hora de inicio"
        )

    await db.flush()
    await db.refresh(activity)
    return activity


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(
    activity_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Activity).where(
            and_(Activity.id == activity_id, Activity.user_id == current_user.id)
        )
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Actividad no encontrada")
    await db.delete(activity)
