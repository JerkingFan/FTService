from datetime import datetime

from pydantic import BaseModel, Field


class SavedSearchCreate(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    q: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=32)
    part_number: str | None = Field(default=None, max_length=64)


class SavedSearchOut(BaseModel):
    id: int
    label: str
    q: str | None
    category: str | None
    part_number: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserLibraryOut(BaseModel):
    favorite_part_ids: list[int]
    favorite_master_ids: list[int]
    viewed_part_ids: list[int]
    saved_searches: list[SavedSearchOut]


class UploadImagesOut(BaseModel):
    urls: list[str]
