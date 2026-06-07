import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    buyer = "buyer"
    seller = "seller"
    master = "master"
    moderator = "moderator"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    full_name: Mapped[str] = mapped_column(String(120))
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.buyer)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    master_profile: Mapped["Master | None"] = relationship(back_populates="user", uselist=False)
    bookings: Mapped[list["Booking"]] = relationship(back_populates="buyer")
    repairs: Mapped[list["RepairRecord"]] = relationship(back_populates="buyer")
    favorite_parts: Mapped[list["FavoritePart"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    favorite_masters: Mapped[list["FavoriteMaster"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    viewed_parts: Mapped[list["ViewedPart"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    saved_searches: Mapped[list["SavedSearch"]] = relationship(back_populates="user", cascade="all, delete-orphan")
