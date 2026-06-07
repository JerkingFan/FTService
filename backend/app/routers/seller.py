from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Part, PartStatus, PartSubmission, User, UserRole
from app.schemas.part import PartOut, PartSubmissionOut
from app.schemas.seller import SellerDashboardOut

router = APIRouter(prefix="/seller", tags=["seller"])


def _seller_filter(user: User):
    clauses = [PartSubmission.user_id == user.id]
    if user.phone:
        clauses.append(PartSubmission.contact_phone == user.phone)
    return or_(*clauses)


@router.get("/dashboard", response_model=SellerDashboardOut)
def seller_dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role not in (UserRole.seller, UserRole.buyer, UserRole.admin):
        pass

    subs = db.scalars(
        select(PartSubmission).where(_seller_filter(user)).order_by(PartSubmission.created_at.desc())
    ).all()

    parts = db.scalars(
        select(Part)
        .where(Part.seller_id == user.id, Part.status == PartStatus.published)
        .order_by(Part.created_at.desc())
    ).all()

    pending = sum(1 for s in subs if s.status == PartStatus.pending)

    return SellerDashboardOut(
        submissions=[PartSubmissionOut.from_orm_submission(s) for s in subs],
        published_parts=[PartOut.from_orm_part(p) for p in parts],
        pending_count=pending,
        published_count=len(parts),
    )


@router.get("/submissions", response_model=list[PartSubmissionOut])
def my_submissions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    subs = db.scalars(
        select(PartSubmission).where(_seller_filter(user)).order_by(PartSubmission.created_at.desc())
    ).all()
    return [PartSubmissionOut.from_orm_submission(s) for s in subs]


@router.get("/parts", response_model=list[PartOut])
def my_published_parts(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    parts = db.scalars(
        select(Part)
        .where(Part.seller_id == user.id, Part.status == PartStatus.published)
        .order_by(Part.created_at.desc())
    ).all()
    return [PartOut.from_orm_part(p) for p in parts]
