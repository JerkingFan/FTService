from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_optional_user, require_roles
from app.categories import CATEGORIES
from app.database import get_db
from app.models import Part, PartCondition, PartStatus, PartSubmission, User, UserRole
from app.parts_query import matches_part, sort_parts
from app.schemas.common import PaginatedResponse, paginate_list
from app.schemas.part import PartCreate, PartOut, PartSubmissionCreate, PartSubmissionOut, PartUpdate

router = APIRouter(prefix="/parts", tags=["parts"])


@router.get("/categories")
def list_categories():
    return CATEGORIES


@router.get("", response_model=PaginatedResponse[PartOut])
def list_parts(
    q: str | None = None,
    part_number: str | None = None,
    car_fit: str | None = None,
    category: str | None = None,
    condition: PartCondition | None = None,
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    location: str | None = None,
    verified_only: bool = Query(default=False),
    sort: str | None = Query(default="newest", pattern="^(newest|price_asc|price_desc)$"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(Part).where(Part.status == PartStatus.published)
    if category and category != "all":
        stmt = stmt.where(Part.category == category)
    if condition:
        stmt = stmt.where(Part.condition == condition)
    if min_price:
        stmt = stmt.where(Part.price >= min_price)
    if max_price:
        stmt = stmt.where(Part.price <= max_price)
    if verified_only:
        stmt = stmt.where(Part.verified == True)  # noqa: E712

    parts = list(db.scalars(stmt).all())
    q_lower = q.lower().strip() if q else ""
    parts = [p for p in parts if matches_part(p, q_lower, part_number, car_fit, location)]
    parts = sort_parts(parts, sort)
    total = len(parts)
    slice_, _ = paginate_list(parts, page, limit)
    items = [PartOut.from_orm_part(p) for p in slice_]
    return PaginatedResponse.build(items, total, page, limit)


@router.get("/{part_id}", response_model=PartOut)
def get_part(part_id: int, db: Session = Depends(get_db)):
    part = db.get(Part, part_id)
    if not part or part.status != PartStatus.published:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    return PartOut.from_orm_part(part)


@router.post("/submissions", response_model=PartSubmissionOut, status_code=201)
def create_submission(
    data: PartSubmissionCreate,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    payload = data.model_dump_for_db()
    if user:
        payload["user_id"] = user.id
        if user.role == UserRole.seller and not payload.get("contact_name"):
            payload["contact_name"] = user.full_name
    sub = PartSubmission(**payload, status=PartStatus.pending)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return PartSubmissionOut.from_orm_submission(sub)


@router.post("", response_model=PartOut, status_code=201)
def create_part(
    data: PartCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.moderator, UserRole.admin)),
):
    part = Part(
        **data.model_dump_for_db(),
        status=PartStatus.published,
        published_at=datetime.now(timezone.utc),
        seller_id=user.id if user.role != UserRole.moderator else None,
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    return PartOut.from_orm_part(part)


@router.patch("/{part_id}", response_model=PartOut)
def update_part(
    part_id: int,
    data: PartUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.moderator, UserRole.admin)),
):
    part = db.get(Part, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Не найдено")
    for k, v in data.model_dump_for_db().items():
        setattr(part, k, v)
    db.commit()
    db.refresh(part)
    return PartOut.from_orm_part(part)
