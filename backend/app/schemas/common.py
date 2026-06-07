import math
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    limit: int
    pages: int

    @classmethod
    def build(cls, items: list[T], total: int, page: int, limit: int) -> "PaginatedResponse[T]":
        pages = max(1, math.ceil(total / limit)) if limit else 1
        return cls(items=items, total=total, page=page, limit=limit, pages=pages)


class ToggleOut(BaseModel):
    active: bool


class IdsOut(BaseModel):
    ids: list[int]


class MessageOut(BaseModel):
    ok: bool = True
    message: str | None = None


def paginate_list(items: list, page: int, limit: int) -> tuple[list, int]:
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    return items[start:end], total
