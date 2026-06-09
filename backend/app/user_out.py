from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Master, User, UserRole
from app.schemas.auth import UserOut


def build_user_out(db: Session, user: User) -> UserOut:
    master_id = None
    if user.role == UserRole.master:
        master_id = db.scalar(select(Master.id).where(Master.user_id == user.id))
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        master_id=master_id,
    )
