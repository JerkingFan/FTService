from datetime import date, datetime, time

from pydantic import BaseModel, Field

from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    master_id: int
    service: str
    booking_date: date
    booking_time: time
    phone: str = Field(min_length=9, max_length=32)
    problem: str | None = None


class BookingOut(BaseModel):
    id: int
    master_id: int
    master_name: str
    service: str
    booking_date: date
    booking_time: time
    status: BookingStatus
    phone: str

    model_config = {"from_attributes": True}


class RepairOut(BaseModel):
    id: int
    title: str
    master: str
    cost: int
    date: date
    part: str | None = None

    model_config = {"from_attributes": True}


class CabinetOut(BaseModel):
    bookings: list[BookingOut]
    repairs: list[RepairOut]


class MasterProfileOut(BaseModel):
    id: int
    name: str
    district: str
    is_active: bool
    is_verified: bool


class MasterBookingOut(BaseModel):
    id: int
    buyer_name: str
    service: str
    booking_date: date
    booking_time: time
    status: BookingStatus
    phone: str
    problem: str | None = None
    created_at: datetime | None = None


class MasterCabinetOut(BaseModel):
    profile: MasterProfileOut
    bookings: list[MasterBookingOut]
    pending_count: int


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
