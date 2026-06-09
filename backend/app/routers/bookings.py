from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Booking, Master, RepairRecord, User, UserRole
from app.models.booking import BookingStatus
from app.schemas.booking import (
    BookingCreate,
    BookingOut,
    BookingStatusUpdate,
    CabinetOut,
    MasterBookingOut,
    MasterCabinetOut,
    MasterProfileOut,
    MasterSummaryOut,
    RepairOut,
)

router = APIRouter(prefix="/bookings", tags=["bookings"])


def _get_user_master(db: Session, user: User) -> Master:
    if user.role != UserRole.master:
        raise HTTPException(status_code=403, detail="Только для мастеров")
    master = db.scalar(select(Master).where(Master.user_id == user.id))
    if not master:
        raise HTTPException(status_code=404, detail="Профиль мастера не привязан к аккаунту")
    return master


def _master_booking_out(booking: Booking, buyer: User | None) -> MasterBookingOut:
    return MasterBookingOut(
        id=booking.id,
        buyer_name=buyer.full_name if buyer else "—",
        service=booking.service,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        status=booking.status,
        phone=booking.phone,
        problem=booking.problem,
        created_at=booking.created_at,
    )


def _allowed_status_change(current: BookingStatus, new: BookingStatus) -> bool:
    if current == BookingStatus.pending and new in (BookingStatus.confirmed, BookingStatus.cancelled):
        return True
    if current == BookingStatus.confirmed and new in (BookingStatus.completed, BookingStatus.cancelled):
        return True
    return False


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    master = db.get(Master, data.master_id)
    if not master or not master.is_active:
        raise HTTPException(status_code=404, detail="Мастер не найден")
    if master.user_id == user.id:
        raise HTTPException(status_code=400, detail="Нельзя записаться к себе")
    booking = Booking(
        buyer_id=user.id,
        master_id=data.master_id,
        service=data.service,
        booking_date=data.booking_date,
        booking_time=data.booking_time,
        phone=data.phone,
        problem=data.problem,
        price_estimate=master.price_from,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return BookingOut(
        id=booking.id,
        master_id=booking.master_id,
        master_name=master.name,
        service=booking.service,
        booking_date=booking.booking_date,
        booking_time=booking.booking_time,
        status=booking.status,
        phone=booking.phone,
    )


@router.get("/cabinet", response_model=CabinetOut)
def my_cabinet(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    bookings = db.scalars(
        select(Booking).where(Booking.buyer_id == user.id).order_by(Booking.booking_date.desc())
    ).all()
    repairs = db.scalars(
        select(RepairRecord).where(RepairRecord.buyer_id == user.id).order_by(RepairRecord.repair_date.desc())
    ).all()

    booking_out = []
    for b in bookings:
        master = db.get(Master, b.master_id)
        booking_out.append(
            BookingOut(
                id=b.id,
                master_id=b.master_id,
                master_name=master.name if master else "—",
                service=b.service,
                booking_date=b.booking_date,
                booking_time=b.booking_time,
                status=b.status,
                phone=b.phone,
            )
        )

    repair_out = []
    for r in repairs:
        master = db.get(Master, r.master_id)
        repair_out.append(
            RepairOut(
                id=r.id,
                title=r.title,
                master=master.name if master else "—",
                cost=r.cost,
                date=r.repair_date,
                part=r.part_note,
            )
        )

    return CabinetOut(bookings=booking_out, repairs=repair_out)


@router.get("/master/summary", response_model=MasterSummaryOut)
def master_summary(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    master = _get_user_master(db, user)
    pending_count = (
        db.scalar(
            select(func.count())
            .select_from(Booking)
            .where(Booking.master_id == master.id, Booking.status == BookingStatus.pending)
        )
        or 0
    )
    latest_booking_id = db.scalar(
        select(Booking.id)
        .where(Booking.master_id == master.id)
        .order_by(Booking.id.desc())
        .limit(1)
    )
    latest_pending_id = db.scalar(
        select(Booking.id)
        .where(Booking.master_id == master.id, Booking.status == BookingStatus.pending)
        .order_by(Booking.id.desc())
        .limit(1)
    )
    return MasterSummaryOut(
        pending_count=pending_count,
        latest_booking_id=latest_booking_id,
        latest_pending_id=latest_pending_id,
    )


@router.get("/master", response_model=MasterCabinetOut)
def master_cabinet(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    master = _get_user_master(db, user)
    bookings = db.scalars(
        select(Booking)
        .where(Booking.master_id == master.id)
        .order_by(
            case((Booking.status == BookingStatus.pending, 0), else_=1),
            Booking.booking_date.asc(),
            Booking.booking_time.asc(),
        )
    ).all()

    booking_out = []
    pending_count = 0
    for b in bookings:
        if b.status == BookingStatus.pending:
            pending_count += 1
        buyer = db.get(User, b.buyer_id)
        booking_out.append(_master_booking_out(b, buyer))

    return MasterCabinetOut(
        profile=MasterProfileOut(
            id=master.id,
            name=master.name,
            district=master.district,
            is_active=master.is_active,
            is_verified=master.is_verified,
        ),
        bookings=booking_out,
        pending_count=pending_count,
    )


@router.patch("/{booking_id}/status", response_model=MasterBookingOut)
def update_booking_status(
    booking_id: int,
    data: BookingStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    master = _get_user_master(db, user)
    booking = db.get(Booking, booking_id)
    if not booking or booking.master_id != master.id:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    if not _allowed_status_change(booking.status, data.status):
        raise HTTPException(status_code=400, detail="Нельзя изменить статус таким образом")

    booking.status = data.status
    db.commit()
    db.refresh(booking)
    buyer = db.get(User, booking.buyer_id)
    return _master_booking_out(booking, buyer)
