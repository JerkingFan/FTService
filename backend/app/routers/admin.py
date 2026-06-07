from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth import require_admin, require_roles
from app.database import get_db
from app.models import (
    Booking,
    BookingStatus,
    Master,
    Part,
    PartStatus,
    PartSubmission,
    User,
    UserRole,
)
from app.schemas.admin import (
    AdminStatsOut,
    MasterAdminCreate,
    MasterAdminOut,
    MasterAdminUpdate,
    PartAdminOut,
    UserAdminOut,
    UserAdminUpdate,
)
from app.schemas.part import PartOut, PartSubmissionOut, PartSubmissionUpdate, PartUpdate

router = APIRouter(prefix="/admin", tags=["admin"])


# ——— Модерация (модератор + админ) ———

@router.get("/submissions", response_model=list[PartSubmissionOut])
def list_pending_submissions(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.moderator)),
):
    subs = db.scalars(
        select(PartSubmission)
        .where(PartSubmission.status == PartStatus.pending)
        .order_by(PartSubmission.created_at.asc())
    ).all()
    return [PartSubmissionOut.from_orm_submission(s) for s in subs]


@router.patch("/submissions/{submission_id}", response_model=PartSubmissionOut)
def update_submission(
    submission_id: int,
    data: PartSubmissionUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles(UserRole.moderator)),
):
    sub = db.get(PartSubmission, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if sub.status != PartStatus.pending:
        raise HTTPException(status_code=400, detail="Редактировать можно только заявки в очереди")
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Нет данных для обновления")
    for key, value in updates.items():
        setattr(sub, key, value)
    db.commit()
    db.refresh(sub)
    return PartSubmissionOut.from_orm_submission(sub)


@router.post("/submissions/{submission_id}/approve", response_model=PartOut)
def approve_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    moderator: User = Depends(require_roles(UserRole.moderator)),
):
    sub = db.get(PartSubmission, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if sub.status != PartStatus.pending:
        raise HTTPException(status_code=400, detail="Заявка уже обработана")

    part = Part(
        title=sub.title,
        part_number=sub.part_number,
        price=sub.price,
        condition=sub.condition,
        category=sub.category,
        car=sub.car,
        fits_json=sub.fits_json,
        location=sub.location,
        seller_name=sub.contact_name,
        phone=sub.contact_phone,
        images_json=sub.images_json,
        image_url=None,
        seller_id=sub.user_id,
        verified=True,
        status=PartStatus.published,
        published_at=datetime.now(timezone.utc),
    )
    if sub.images_json:
        from app.models.part import parse_images

        imgs = parse_images(sub.images_json)
        if imgs:
            part.image_url = imgs[0]
    db.add(part)
    db.flush()

    sub.status = PartStatus.published
    sub.moderator_id = moderator.id
    sub.part_id = part.id
    sub.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(part)
    return PartOut.from_orm_part(part)


@router.post("/submissions/{submission_id}/reject")
def reject_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    moderator: User = Depends(require_roles(UserRole.moderator)),
):
    sub = db.get(PartSubmission, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    sub.status = PartStatus.rejected
    sub.moderator_id = moderator.id
    sub.reviewed_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "status": "rejected"}


# ——— Только администратор ———

@router.get("/stats", response_model=AdminStatsOut)
def admin_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return AdminStatsOut(
        users_total=db.scalar(select(func.count()).select_from(User)) or 0,
        users_buyers=db.scalar(select(func.count()).where(User.role == UserRole.buyer)) or 0,
        users_moderators=db.scalar(
            select(func.count()).where(User.role.in_([UserRole.moderator, UserRole.admin]))
        )
        or 0,
        parts_published=db.scalar(select(func.count()).where(Part.status == PartStatus.published)) or 0,
        parts_archived=db.scalar(select(func.count()).where(Part.status == PartStatus.archived)) or 0,
        submissions_pending=db.scalar(
            select(func.count()).where(PartSubmission.status == PartStatus.pending)
        )
        or 0,
        masters_active=db.scalar(select(func.count()).where(Master.is_active == True)) or 0,
        masters_inactive=db.scalar(select(func.count()).where(Master.is_active == False)) or 0,
        bookings_total=db.scalar(select(func.count()).select_from(Booking)) or 0,
        bookings_pending=db.scalar(select(func.count()).where(Booking.status == BookingStatus.pending)) or 0,
    )


@router.get("/users", response_model=list[UserAdminOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [UserAdminOut.model_validate(u) for u in users]


@router.patch("/users/{user_id}", response_model=UserAdminOut)
def update_user(
    user_id: int,
    data: UserAdminUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.id == admin.id:
        if data.role is not None and data.role != UserRole.admin:
            raise HTTPException(status_code=400, detail="Нельзя понизить свою роль")
        if data.is_active is False:
            raise HTTPException(status_code=400, detail="Нельзя заблокировать себя")
    if data.role == UserRole.admin and user.role != UserRole.admin:
        existing_admins = db.scalar(
            select(func.count()).where(User.role == UserRole.admin, User.is_active == True)
        )
        if existing_admins and existing_admins >= 1:
            pass
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Нет данных для обновления")
    for key, value in updates.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return UserAdminOut.model_validate(user)


@router.get("/parts", response_model=list[PartAdminOut])
def list_all_parts(
    status: str | None = Query(default=None, description="published | archived | all"),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    stmt = select(Part).order_by(Part.created_at.desc())
    if status == "published":
        stmt = stmt.where(Part.status == PartStatus.published)
    elif status == "archived":
        stmt = stmt.where(Part.status == PartStatus.archived)
    parts = db.scalars(stmt).all()
    parts = [p for p in parts if p.status in (PartStatus.published, PartStatus.archived)]
    return [PartAdminOut.model_validate(p) for p in parts]


@router.patch("/parts/{part_id}", response_model=PartAdminOut)
def admin_update_part(
    part_id: int,
    data: PartUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    part = db.get(Part, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    for k, v in data.model_dump_for_db().items():
        setattr(part, k, v)
    db.commit()
    db.refresh(part)
    return PartAdminOut.model_validate(part)


@router.post("/parts/{part_id}/archive")
def archive_part(
    part_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    part = db.get(Part, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    part.status = PartStatus.archived
    db.commit()
    return {"ok": True, "status": "archived"}


@router.post("/parts/{part_id}/publish")
def republish_part(
    part_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    part = db.get(Part, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    part.status = PartStatus.published
    part.published_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True, "status": "published"}


@router.get("/masters", response_model=list[MasterAdminOut])
def list_all_masters(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    masters = db.scalars(select(Master).order_by(Master.name)).all()
    return [MasterAdminOut.model_validate(m) for m in masters]


@router.post("/masters", response_model=MasterAdminOut, status_code=201)
def create_master(
    data: MasterAdminCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    master = Master(**data.model_dump())
    db.add(master)
    db.commit()
    db.refresh(master)
    return MasterAdminOut.model_validate(master)


@router.patch("/masters/{master_id}", response_model=MasterAdminOut)
def update_master(
    master_id: int,
    data: MasterAdminUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    master = db.get(Master, master_id)
    if not master:
        raise HTTPException(status_code=404, detail="Мастер не найден")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(master, k, v)
    db.commit()
    db.refresh(master)
    return MasterAdminOut.model_validate(master)
