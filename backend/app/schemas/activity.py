import uuid
from datetime import datetime, date, time
from pydantic import BaseModel, field_validator, model_validator

# Aliases to avoid name conflicts: field 'date' vs type 'date', 'time' vs 'time'
_Date = date
_Time = time


class ActivityCreate(BaseModel):
    name: str
    date: _Date
    start_time: _Time
    end_time: _Time
    tags: list[str] = []
    observations: str | None = None

    @model_validator(mode="after")
    def end_after_start(self) -> "ActivityCreate":
        if self.end_time <= self.start_time:
            raise ValueError("La hora de fin debe ser posterior a la hora de inicio")
        return self

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: list[str]) -> list[str]:
        return [tag.strip().lower() for tag in v if tag.strip()]

    @field_validator("date")
    @classmethod
    def date_not_in_future(cls, v: _Date) -> _Date:
        if v > date.today():
            raise ValueError("La fecha no puede ser posterior al día de hoy")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El nombre no puede estar vacío")
        return v.strip()


class ActivityUpdate(BaseModel):
    name: str | None = None
    date: _Date | None = None
    start_time: _Time | None = None
    end_time: _Time | None = None
    tags: list[str] | None = None
    observations: str | None = None

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        return [tag.strip().lower() for tag in v if tag.strip()]

    @field_validator("date")
    @classmethod
    def date_not_in_future(cls, v: _Date | None) -> _Date | None:
        if v is not None and v > date.today():
            raise ValueError("La fecha no puede ser posterior al día de hoy")
        return v


class ActivityResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    date: _Date
    start_time: _Time
    end_time: _Time
    tags: list[str]
    observations: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ActivityListResponse(BaseModel):
    items: list[ActivityResponse]
    total: int
    page: int
    page_size: int
    pages: int


class ActivityStatsItem(BaseModel):
    period: str
    total_hours: float
    count: int


class ActivityStatsResponse(BaseModel):
    items: list[ActivityStatsItem]
    total_hours: float
    group_by: str
    date_from: _Date
    date_to: _Date


class AdminActivityResponse(ActivityResponse):
    user_full_name: str
    user_email: str


class AdminActivityListResponse(BaseModel):
    items: list[AdminActivityResponse]
    total: int
    page: int
    page_size: int
    pages: int


class AdminActivitySummaryItem(BaseModel):
    user_id: uuid.UUID
    user_full_name: str
    period: str
    total_hours: float
    count: int


class AdminActivitySummaryResponse(BaseModel):
    items: list[AdminActivitySummaryItem]
    total_hours: float
    group_by: str
    date_from: _Date
    date_to: _Date
