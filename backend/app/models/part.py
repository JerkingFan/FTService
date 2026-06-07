import enum
import json
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PartCondition(str, enum.Enum):
    used = "used"
    new = "new"


class PartStatus(str, enum.Enum):
    pending = "pending"
    published = "published"
    rejected = "rejected"
    archived = "archived"


def parse_fits(fits_json: str | None) -> list[str]:
    if not fits_json:
        return []
    try:
        data = json.loads(fits_json)
        if isinstance(data, list):
            return [str(x).strip() for x in data if str(x).strip()]
    except (json.JSONDecodeError, TypeError):
        pass
    return []


def dumps_fits(fits: list[str] | None) -> str | None:
    if not fits:
        return None
    cleaned = [str(x).strip() for x in fits if str(x).strip()]
    return json.dumps(cleaned, ensure_ascii=False) if cleaned else None


def parse_images(images_json: str | None) -> list[str]:
    if not images_json:
        return []
    try:
        data = json.loads(images_json)
        if isinstance(data, list):
            return [str(x).strip() for x in data if str(x).strip()]
    except (json.JSONDecodeError, TypeError):
        pass
    return []


def dumps_images(images: list[str] | None) -> str | None:
    if not images:
        return None
    cleaned = [str(x).strip() for x in images if str(x).strip()]
    return json.dumps(cleaned, ensure_ascii=False) if cleaned else None


def parse_attributes(attributes_json: str | None) -> dict[str, str]:
    if not attributes_json:
        return {}
    try:
        data = json.loads(attributes_json)
        if isinstance(data, dict):
            return {str(k): str(v) for k, v in data.items()}
    except (json.JSONDecodeError, TypeError):
        pass
    return {}


def dumps_attributes(attrs: dict[str, str] | None) -> str | None:
    if not attrs:
        return None
    cleaned = {str(k): str(v) for k, v in attrs.items() if str(k).strip()}
    return json.dumps(cleaned, ensure_ascii=False) if cleaned else None


class Part(Base):
    __tablename__ = "parts"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    part_number: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    price: Mapped[int] = mapped_column(Integer)
    condition: Mapped[PartCondition] = mapped_column(Enum(PartCondition))
    category: Mapped[str] = mapped_column(String(32), index=True)
    car: Mapped[str] = mapped_column(String(120))
    fits_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(120))
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seller_name: Mapped[str] = mapped_column(String(120))
    seller_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    working_hours: Mapped[str | None] = mapped_column(String(120), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=True)
    status: Mapped[PartStatus] = mapped_column(Enum(PartStatus), default=PartStatus.published, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    images_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    attributes_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    @property
    def fits(self) -> list[str]:
        return parse_fits(self.fits_json)

    @property
    def images(self) -> list[str]:
        imgs = parse_images(self.images_json)
        if imgs:
            return imgs
        if self.image_url:
            return [self.image_url]
        return []

    @property
    def attributes(self) -> dict[str, str]:
        return parse_attributes(self.attributes_json)


class PartSubmission(Base):
    """Заявка из формы / мессенджера — ждёт модератора."""

    __tablename__ = "part_submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    contact_name: Mapped[str] = mapped_column(String(120))
    contact_phone: Mapped[str] = mapped_column(String(32))
    title: Mapped[str] = mapped_column(String(255))
    part_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    price: Mapped[int] = mapped_column(Integer)
    condition: Mapped[PartCondition] = mapped_column(Enum(PartCondition))
    category: Mapped[str] = mapped_column(String(32))
    car: Mapped[str] = mapped_column(String(120))
    fits_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[PartStatus] = mapped_column(Enum(PartStatus), default=PartStatus.pending)
    moderator_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    part_id: Mapped[int | None] = mapped_column(ForeignKey("parts.id"), nullable=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    images_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    part: Mapped[Part | None] = relationship()
