import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator

from app.models.user import UserRole


ALLOWED_DOMAIN = "solucionessyh.com"


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str

    @field_validator("email")
    @classmethod
    def email_domain(cls, v: str) -> str:
        domain = v.split("@")[-1].lower()
        if domain != ALLOWED_DOMAIN:
            raise ValueError(f"Solo se permiten correos @{ALLOWED_DOMAIN}")
        return v.lower()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not any(c.isupper() for c in v):
            raise ValueError("La contraseña debe tener al menos una mayúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("La contraseña debe tener al menos un número")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    is_active: bool | None = None
    role: UserRole | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
