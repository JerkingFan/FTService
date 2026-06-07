from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserRegisterPublic(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    role: UserRole = UserRole.buyer
    # для мастера при регистрации
    district: str | None = Field(default=None, max_length=120)
    spec: str | None = Field(default="Автоэлектрик", max_length=120)

    @field_validator("role")
    @classmethod
    def public_roles_only(cls, v: UserRole) -> UserRole:
        if v not in (UserRole.buyer, UserRole.seller, UserRole.master):
            raise ValueError("Доступны роли: покупатель, продавец, мастер")
        return v

    @field_validator("district")
    @classmethod
    def master_needs_district(cls, v, info):
        role = info.data.get("role")
        if role == UserRole.master and not (v and v.strip()):
            raise ValueError("Укажите район для профиля мастера")
        return v.strip() if v else v


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = None
    role: UserRole = UserRole.buyer


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str | None
    role: UserRole

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    message: str | None = None
