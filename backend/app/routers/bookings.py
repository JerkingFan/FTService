from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Booking, Master, RepairRecord, User
from app.schemas.booking import BookingCreate, BookingOut, CabinetOut, RepairOut

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    master = db.get(Master, data.master_id)
    if not master or not master.is_active:
        raise HTTPException(status_code=404, detail="Мастер не найден")
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
