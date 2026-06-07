from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Master(Base):
    __tablename__ = "masters"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(120))
    spec: Mapped[str] = mapped_column(String(120), default="Автоэлектрик")
    experience: Mapped[str] = mapped_column(String(64))
    rating: Mapped[float] = mapped_column(Float, default=5.0)
    jobs_count: Mapped[int] = mapped_column(Integer, default=0)
    district: Mapped[str] = mapped_column(String(120))
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    telegram: Mapped[str | None] = mapped_column(String(64), nullable=True)
    working_hours: Mapped[str | None] = mapped_column(String(120), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    price_from: Mapped[int] = mapped_column(Integer, default=500)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User | None"] = relationship(back_populates="master_profile")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="master")
    repairs: Mapped[list["RepairRecord"]] = relationship(back_populates="master")
