from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.part import PartCondition, PartStatus
from app.models.user import UserRole


class AdminStatsOut(BaseModel):
    users_total: int
    users_buyers: int
    users_moderators: int
    parts_published: int
    parts_archived: int
    submissions_pending: int
    masters_active: int
    masters_inactive: int
    bookings_total: int
    bookings_pending: int


class UserAdminOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserAdminUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=32)


class PartAdminOut(BaseModel):
    id: int
    title: str
    price: int
    condition: PartCondition
    category: str
    car: str
    location: str
    seller_name: str
    verified: bool
    status: PartStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class MasterAdminOut(BaseModel):
    id: int
    name: str
    spec: str
    experience: str
    rating: float
    jobs_count: int
    district: str
    price_from: int
    is_verified: bool
    is_active: bool

    model_config = {"from_attributes": True}


class MasterAdminCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    spec: str = Field(default="Автоэлектрик", max_length=120)
    experience: str = Field(min_length=2, max_length=64)
    rating: float = Field(default=5.0, ge=0, le=5)
    jobs_count: int = Field(default=0, ge=0)
    district: str = Field(min_length=2, max_length=120)
    price_from: int = Field(default=500, gt=0)
    is_verified: bool = True
    is_active: bool = True
    bio: str | None = None


class MasterAdminUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    spec: str | None = None
    experience: str | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    jobs_count: int | None = Field(default=None, ge=0)
    district: str | None = None
    price_from: int | None = Field(default=None, gt=0)
    is_verified: bool | None = None
    is_active: bool | None = None
    bio: str | None = None
