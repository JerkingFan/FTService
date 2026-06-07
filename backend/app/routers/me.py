from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    FavoriteMaster,
    FavoritePart,
    Master,
    Part,
    PartStatus,
    SavedSearch,
    User,
    ViewedPart,
)
from app.schemas.common import IdsOut, MessageOut, ToggleOut
from app.schemas.engagement import SavedSearchCreate, SavedSearchOut, UserLibraryOut
from app.schemas.master import MasterOut
from app.schemas.part import PartOut

router = APIRouter(prefix="/me", tags=["me"])

MAX_VIEWED = 50


def _published_part(db: Session, part_id: int) -> Part:
    part = db.get(Part, part_id)
    if not part or part.status != PartStatus.published:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    return part


def _active_master(db: Session, master_id: int) -> Master:
    master = db.get(Master, master_id)
    if not master or not master.is_active:
        raise HTTPException(status_code=404, detail="Мастер не найден")
    return master


@router.get("/library", response_model=UserLibraryOut)
def get_library(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    fav_parts = db.scalars(
        select(FavoritePart.part_id).where(FavoritePart.user_id == user.id).order_by(FavoritePart.created_at.desc())
    ).all()
    fav_masters = db.scalars(
        select(FavoriteMaster.master_id)
        .where(FavoriteMaster.user_id == user.id)
        .order_by(FavoriteMaster.created_at.desc())
    ).all()
    viewed = db.scalars(
        select(ViewedPart.part_id)
        .where(ViewedPart.user_id == user.id)
        .order_by(ViewedPart.viewed_at.desc())
        .limit(MAX_VIEWED)
    ).all()
    searches = db.scalars(
        select(SavedSearch).where(SavedSearch.user_id == user.id).order_by(SavedSearch.created_at.desc())
    ).all()
    return UserLibraryOut(
        favorite_part_ids=list(fav_parts),
        favorite_master_ids=list(fav_masters),
        viewed_part_ids=list(viewed),
        saved_searches=[SavedSearchOut.model_validate(s) for s in searches],
    )


@router.get("/favorites/parts", response_model=list[PartOut])
def list_favorite_parts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ids = db.scalars(select(FavoritePart.part_id).where(FavoritePart.user_id == user.id)).all()
    if not ids:
        return []
    parts = db.scalars(select(Part).where(Part.id.in_(ids), Part.status == PartStatus.published)).all()
    by_id = {p.id: p for p in parts}
    return [PartOut.from_orm_part(by_id[i]) for i in ids if i in by_id]


@router.post("/favorites/parts/{part_id}", response_model=ToggleOut)
def toggle_favorite_part(
    part_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _published_part(db, part_id)
    row = db.scalar(
        select(FavoritePart).where(FavoritePart.user_id == user.id, FavoritePart.part_id == part_id)
    )
    if row:
        db.delete(row)
        db.commit()
        return ToggleOut(active=False)
    db.add(FavoritePart(user_id=user.id, part_id=part_id))
    db.commit()
    return ToggleOut(active=True)


@router.get("/favorites/parts/ids", response_model=IdsOut)
def favorite_part_ids(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ids = db.scalars(select(FavoritePart.part_id).where(FavoritePart.user_id == user.id)).all()
    return IdsOut(ids=list(ids))


@router.get("/favorites/masters", response_model=list[MasterOut])
def list_favorite_masters(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ids = db.scalars(select(FavoriteMaster.master_id).where(FavoriteMaster.user_id == user.id)).all()
    if not ids:
        return []
    masters = db.scalars(select(Master).where(Master.id.in_(ids), Master.is_active == True)).all()
    by_id = {m.id: m for m in masters}
    return [MasterOut.from_orm_master(by_id[i]) for i in ids if i in by_id]


@router.post("/favorites/masters/{master_id}", response_model=ToggleOut)
def toggle_favorite_master(
    master_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _active_master(db, master_id)
    row = db.scalar(
        select(FavoriteMaster).where(
            FavoriteMaster.user_id == user.id, FavoriteMaster.master_id == master_id
        )
    )
    if row:
        db.delete(row)
        db.commit()
        return ToggleOut(active=False)
    db.add(FavoriteMaster(user_id=user.id, master_id=master_id))
    db.commit()
    return ToggleOut(active=True)


@router.get("/favorites/masters/ids", response_model=IdsOut)
def favorite_master_ids(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ids = db.scalars(select(FavoriteMaster.master_id).where(FavoriteMaster.user_id == user.id)).all()
    return IdsOut(ids=list(ids))


@router.get("/viewed/parts", response_model=list[PartOut])
def list_viewed_parts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(
        select(ViewedPart)
        .where(ViewedPart.user_id == user.id)
        .order_by(ViewedPart.viewed_at.desc())
        .limit(MAX_VIEWED)
    ).all()
    if not rows:
        return []
    ids = [r.part_id for r in rows]
    parts = db.scalars(select(Part).where(Part.id.in_(ids), Part.status == PartStatus.published)).all()
    by_id = {p.id: p for p in parts}
    return [PartOut.from_orm_part(by_id[i]) for i in ids if i in by_id]


@router.post("/viewed/parts/{part_id}", response_model=MessageOut)
def mark_viewed_part(
    part_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _published_part(db, part_id)
    row = db.scalar(
        select(ViewedPart).where(ViewedPart.user_id == user.id, ViewedPart.part_id == part_id)
    )
    if row:
        from datetime import datetime, timezone

        row.viewed_at = datetime.now(timezone.utc)
    else:
        db.add(ViewedPart(user_id=user.id, part_id=part_id))
    db.flush()
    extra = db.scalars(
        select(ViewedPart)
        .where(ViewedPart.user_id == user.id)
        .order_by(ViewedPart.viewed_at.desc())
        .offset(MAX_VIEWED)
    ).all()
    for old in extra:
        db.delete(old)
    db.commit()
    return MessageOut(message="ok")


@router.delete("/viewed/parts", response_model=MessageOut)
def clear_viewed_parts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    for row in db.scalars(select(ViewedPart).where(ViewedPart.user_id == user.id)).all():
        db.delete(row)
    db.commit()
    return MessageOut(message="cleared")


@router.get("/saved-searches", response_model=list[SavedSearchOut])
def list_saved_searches(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(
        select(SavedSearch).where(SavedSearch.user_id == user.id).order_by(SavedSearch.created_at.desc())
    ).all()
    return [SavedSearchOut.model_validate(r) for r in rows]


@router.post("/saved-searches", response_model=SavedSearchOut, status_code=201)
def create_saved_search(
    data: SavedSearchCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    existing = db.scalar(
        select(SavedSearch).where(SavedSearch.user_id == user.id, SavedSearch.label == data.label)
    )
    if existing:
        for key, val in data.model_dump().items():
            setattr(existing, key, val)
        db.commit()
        db.refresh(existing)
        return SavedSearchOut.model_validate(existing)
    row = SavedSearch(user_id=user.id, **data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return SavedSearchOut.model_validate(row)


@router.delete("/saved-searches/{search_id}", response_model=MessageOut)
def delete_saved_search(
    search_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = db.get(SavedSearch, search_id)
    if not row or row.user_id != user.id:
        raise HTTPException(status_code=404, detail="Поиск не найден")
    db.delete(row)
    db.commit()
    return MessageOut(message="deleted")
