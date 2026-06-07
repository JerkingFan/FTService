from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.models.part import (
    PartCondition,
    PartStatus,
    dumps_attributes,
    dumps_fits,
    dumps_images,
    parse_attributes,
    parse_fits,
    parse_images,
)


class PartOut(BaseModel):
    id: int
    title: str
    part_number: str | None = None
    price: int
    condition: PartCondition
    category: str
    car: str
    fits: list[str] = []
    location: str
    address: str | None = None
    seller: str
    phone: str | None = None
    working_hours: str | None = None
    verified: bool
    description: str | None = None
    image_url: str | None = None
    images: list[str] = []
    attributes: dict[str, str] = {}

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_part(cls, part) -> "PartOut":
        images = part.images if hasattr(part, "images") else parse_images(part.images_json)
        if not images and part.image_url:
            images = [part.image_url]
        attrs = part.attributes if hasattr(part, "attributes") else parse_attributes(part.attributes_json)
        return cls(
            id=part.id,
            title=part.title,
            part_number=part.part_number,
            price=part.price,
            condition=part.condition,
            category=part.category,
            car=part.car,
            fits=part.fits if hasattr(part, "fits") else parse_fits(part.fits_json),
            location=part.location,
            address=part.address,
            seller=part.seller_name,
            phone=part.phone,
            working_hours=part.working_hours,
            verified=part.verified,
            description=part.description,
            image_url=images[0] if images else part.image_url,
            images=images,
            attributes=attrs,
        )


class PartCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    part_number: str | None = Field(default=None, max_length=64)
    price: int = Field(gt=0)
    condition: PartCondition
    category: str
    car: str
    fits: list[str] | None = None
    location: str
    address: str | None = None
    seller_name: str
    phone: str | None = None
    working_hours: str | None = None
    verified: bool = True
    description: str | None = None
    image_url: str | None = None
    images: list[str] | None = None
    attributes: dict[str, str] | None = None

    def model_dump_for_db(self) -> dict:
        data = self.model_dump(exclude={"fits", "images", "attributes"})
        data["fits_json"] = dumps_fits(self.fits)
        imgs = self.images or ([self.image_url] if self.image_url else None)
        data["images_json"] = dumps_images(imgs)
        data["attributes_json"] = dumps_attributes(self.attributes)
        if imgs and not data.get("image_url"):
            data["image_url"] = imgs[0]
        return data


class PartUpdate(BaseModel):
    title: str | None = None
    part_number: str | None = Field(default=None, max_length=64)
    price: int | None = Field(default=None, gt=0)
    condition: PartCondition | None = None
    category: str | None = None
    car: str | None = None
    fits: list[str] | None = None
    location: str | None = None
    address: str | None = None
    seller_name: str | None = None
    phone: str | None = None
    working_hours: str | None = None
    verified: bool | None = None
    status: PartStatus | None = None
    description: str | None = None
    image_url: str | None = None

    images: list[str] | None = None
    attributes: dict[str, str] | None = None

    def model_dump_for_db(self) -> dict:
        data = self.model_dump(exclude_unset=True, exclude={"fits", "images", "attributes"})
        if self.fits is not None:
            data["fits_json"] = dumps_fits(self.fits)
        if self.images is not None:
            data["images_json"] = dumps_images(self.images)
            if self.images:
                data["image_url"] = self.images[0]
        if self.attributes is not None:
            data["attributes_json"] = dumps_attributes(self.attributes)
        return data


class PartSubmissionCreate(BaseModel):
    contact_name: str
    contact_phone: str
    title: str
    part_number: str | None = Field(default=None, max_length=64)
    price: int = Field(gt=0)
    condition: PartCondition
    category: str
    car: str
    fits: list[str] | None = None
    location: str
    notes: str | None = None
    image_urls: list[str] | None = None

    @field_validator("fits", mode="before")
    @classmethod
    def parse_fits_field(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            return [x.strip() for x in v.replace(";", ",").split(",") if x.strip()]
        return v

    def model_dump_for_db(self) -> dict:
        data = self.model_dump(exclude={"fits", "image_urls"})
        data["fits_json"] = dumps_fits(self.fits)
        urls = self.image_urls or []
        data["images_json"] = dumps_images(urls if urls else None)
        return data


class PartSubmissionUpdate(BaseModel):
    contact_name: str | None = Field(default=None, min_length=2, max_length=120)
    contact_phone: str | None = Field(default=None, min_length=9, max_length=32)
    title: str | None = Field(default=None, min_length=3, max_length=255)
    part_number: str | None = Field(default=None, max_length=64)
    price: int | None = Field(default=None, gt=0)
    condition: PartCondition | None = None
    category: str | None = None
    car: str | None = Field(default=None, max_length=120)
    fits: list[str] | None = None
    location: str | None = Field(default=None, max_length=120)
    notes: str | None = None


class PartSubmissionOut(BaseModel):
    id: int
    contact_name: str
    contact_phone: str
    title: str
    part_number: str | None = None
    price: int
    condition: PartCondition
    category: str
    car: str
    fits: list[str] = []
    location: str
    notes: str | None = None
    images: list[str] = []
    status: PartStatus
    part_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_submission(cls, sub) -> "PartSubmissionOut":
        images = parse_images(getattr(sub, "images_json", None))
        return cls(
            id=sub.id,
            contact_name=sub.contact_name,
            contact_phone=sub.contact_phone,
            title=sub.title,
            part_number=sub.part_number,
            price=sub.price,
            condition=sub.condition,
            category=sub.category,
            car=sub.car,
            fits=parse_fits(sub.fits_json),
            location=sub.location,
            notes=sub.notes,
            images=images,
            status=sub.status,
            part_id=sub.part_id,
            created_at=sub.created_at,
        )
