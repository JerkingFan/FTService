from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import Master, User, UserRole
from app.schemas.auth import Token, UserLogin, UserOut, UserRegisterPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token)
def register(data: UserRegisterPublic, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=400, detail="Этот email уже зарегистрирован")

    user = User(
        email=email,
        full_name=data.full_name.strip(),
        phone=data.phone.strip() if data.phone else None,
        hashed_password=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    db.flush()

    message = None
    if data.role == UserRole.master:
        master = Master(
            user_id=user.id,
            name=data.full_name.strip(),
            spec=data.spec or "Автоэлектрик",
            experience="новый",
            district=data.district.strip(),
            phone=data.phone,
            is_verified=False,
            is_active=False,
        )
        db.add(master)
        message = "Профиль мастера создан. После проверки модератором он появится в каталоге."
    elif data.role == UserRole.seller:
        message = "Аккаунт продавца создан. Подавайте объявления через форму или мессенджеры."

    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.role.value)
    return Token(access_token=token, user=UserOut.model_validate(user), message=message)


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    email = data.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")
    token = create_access_token(user.id, user.role.value)
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)


@router.post("/logout")
def logout():
    return {"ok": True, "message": "Выйдите на клиенте — удалите токен"}
