from datetime import date, time

from sqlalchemy import func, select

from app.auth import hash_password
from app.catalog_data import CATALOG_PARTS
from app.database import SessionLocal
from app.models import (
    Booking,
    BookingStatus,
    Master,
    Part,
    PartCondition,
    PartStatus,
    PartSubmission,
    RepairRecord,
    User,
    UserRole,
)
from app.models.part import dumps_attributes, dumps_fits, dumps_images

MASTERS = [
    ("Темирлан А.", "Автоэлектрик", "8 лет", 4.9, 340, "Джал", 42.8742, 74.5698, "+996555501001", "09:00–19:00"),
    ("Данияр С.", "Слесарь", "5 лет", 4.8, 210, "Асанбай", 42.8267, 74.6883, "+996555501002", "10:00–18:00"),
    ("Канат Б.", "Автоэлектрик", "12 лет", 5.0, 520, "рынок Кудайберген", 42.8756, 74.5833, "+996555501003", "08:00–20:00"),
    ("Айбек М.", "Шиномонтаж", "3 года", 4.7, 95, "Орто-Сай", 42.8361, 74.6114, "+996555501004", "09:00–17:00"),
    ("Эрмек Т.", "Кузовщик", "6 лет", 4.8, 180, "Молодая Гвардия", 42.8578, 74.6042, "+996555501005", "09:00–18:00"),
]


def _add_part(db, p: dict) -> Part:
    images = p.get("images") or []
    part = Part(
        title=p["title"],
        part_number=p.get("part_number"),
        price=p["price"],
        condition=PartCondition(p["condition"]),
        category=p["category"],
        car=p["car"],
        fits_json=dumps_fits(p.get("fits")),
        location=p["location"],
        address=p.get("address"),
        seller_name=p["seller_name"],
        phone=p.get("phone"),
        working_hours=p.get("working_hours"),
        description=p.get("description"),
        verified=p.get("verified", True),
        status=PartStatus.published,
        image_url=p.get("image_url") or (images[0] if images else None),
        images_json=dumps_images(images),
        attributes_json=dumps_attributes(p.get("attributes")),
    )
    db.add(part)
    return part


def _seed_pending_submissions(db):
    if db.scalar(select(PartSubmission).limit(1)):
        return
    db.add_all(
        [
            PartSubmission(
                contact_name="Бакыт Т.",
                contact_phone="+996555111222",
                title="АКПП Toyota Corolla 120 (заявка)",
                part_number="U341E",
                price=45000,
                condition=PartCondition.used,
                category="transmission",
                car="Toyota Corolla",
                fits_json=dumps_fits(["Toyota Corolla 120"]),
                location="рынок Кудайберген",
                notes="Снята с пробегом 80 тыс. км",
                status=PartStatus.pending,
            ),
            PartSubmission(
                contact_name="Нурбек А.",
                contact_phone="+996700333444",
                title="Магнитола Pioneer 2 DIN (заявка)",
                price=5500,
                condition=PartCondition.used,
                category="electrical",
                car="универсальная",
                location="Асанбай",
                notes="Рабочая, без проводки",
                status=PartStatus.pending,
            ),
        ]
    )
    db.commit()


def _ensure_catalog(db):
    """Добавить объявления из каталога, если их мало (обновление старой БД)."""
    count = db.scalar(select(func.count()).select_from(Part)) or 0
    if count >= len(CATALOG_PARTS):
        return
    existing_titles = set(db.scalars(select(Part.title)).all())
    for p in CATALOG_PARTS:
        if p["title"] in existing_titles:
            continue
        _add_part(db, p)
    db.commit()


def _backfill_part_media(db):
    parts = db.scalars(select(Part)).all()
    changed = False
    for i, part in enumerate(parts):
        if part.images_json:
            continue
        images = [u for u in [part.image_url] if u]
        if not images:
            from app.media_urls import gallery_for_index

            images = gallery_for_index(part.id or i)
        part.images_json = dumps_images(images)
        if not part.image_url and images:
            part.image_url = images[0]
        changed = True
    if changed:
        db.commit()


def _backfill_part_sellers(db):
    seller = db.scalar(select(User).where(User.email == "seller@test.kg"))
    if not seller:
        return
    parts = db.scalars(select(Part).where(Part.seller_id.is_(None))).all()
    if not parts:
        return
    for part in parts:
        part.seller_id = seller.id
    db.commit()


def _backfill_masters(db):
    masters = db.scalars(select(Master)).all()
    if not masters or masters[0].latitude is not None:
        return
    by_name = {m[0]: m for m in MASTERS}
    for master in masters:
        tpl = by_name.get(master.name)
        if not tpl:
            continue
        master.spec = tpl[1]
        master.latitude = tpl[5]
        master.longitude = tpl[6]
        master.phone = tpl[7]
        master.working_hours = tpl[8]
        master.telegram = "ftservice_kg"
    db.commit()


def _ensure_test_users(db):
    """Добавить тестовых пользователей, если БД создана до расширения сида."""
    from app.models import User

    specs = [
        ("admin@ftservice.kg", "Админ", UserRole.admin, "admin123", "+996700000001"),
        ("mod@ftservice.kg", "Менеджер", UserRole.moderator, "mod123", "+996700000002"),
        ("buyer@test.kg", "Тест Покупатель", UserRole.buyer, "buyer123", "+996555123456"),
        ("seller@test.kg", "Тест Продавец", UserRole.seller, "seller123", "+996555987654"),
        ("master@test.kg", "Темирлан А.", UserRole.master, "master123", "+996555501001"),
    ]
    for email, name, role, pwd, phone in specs:
        if db.scalar(select(User).where(User.email == email)):
            continue
        db.add(
            User(
                email=email,
                full_name=name,
                hashed_password=hash_password(pwd),
                role=role,
                phone=phone,
            )
        )
    db.commit()
    _ensure_master_account(db)


def _ensure_master_account(db):
    user = db.scalar(select(User).where(User.email == "master@test.kg"))
    if not user:
        return
    if db.scalar(select(Master).where(Master.user_id == user.id)):
        return
    master = db.scalar(select(Master).where(Master.name == "Темирлан А."))
    if not master:
        master = db.scalar(select(Master).where(Master.user_id.is_(None)).order_by(Master.id).limit(1))
    if master and master.user_id is None:
        master.user_id = user.id
        db.commit()


def seed_database():
    db = SessionLocal()
    try:
        if db.scalar(select(Part).limit(1)):
            _ensure_test_users(db)
            _ensure_catalog(db)
            _backfill_part_media(db)
            _backfill_part_sellers(db)
            _backfill_masters(db)
            _seed_pending_submissions(db)
            return

        admin = User(
            email="admin@ftservice.kg",
            full_name="Админ",
            phone="+996700000001",
            hashed_password=hash_password("admin123"),
            role=UserRole.admin,
        )
        mod = User(
            email="mod@ftservice.kg",
            full_name="Менеджер",
            phone="+996700000002",
            hashed_password=hash_password("mod123"),
            role=UserRole.moderator,
        )
        buyer = User(
            email="buyer@test.kg",
            full_name="Тест Покупатель",
            phone="+996555123456",
            hashed_password=hash_password("buyer123"),
            role=UserRole.buyer,
        )
        seller = User(
            email="seller@test.kg",
            full_name="Тест Продавец",
            phone="+996555987654",
            hashed_password=hash_password("seller123"),
            role=UserRole.seller,
        )
        master_user = User(
            email="master@test.kg",
            full_name="Темирлан А.",
            phone="+996555501001",
            hashed_password=hash_password("master123"),
            role=UserRole.master,
        )
        db.add_all([admin, mod, buyer, seller, master_user])
        db.flush()

        for p in CATALOG_PARTS:
            _add_part(db, p)

        master_objs = []
        for name, spec, exp, rating, jobs, district, lat, lng, phone, hours in MASTERS:
            m = Master(
                name=name,
                spec=spec,
                experience=exp,
                rating=rating,
                jobs_count=jobs,
                district=district,
                latitude=lat,
                longitude=lng,
                phone=phone,
                telegram="ftservice_kg",
                working_hours=hours,
                price_from=500,
                is_verified=True,
            )
            db.add(m)
            master_objs.append(m)
        db.flush()

        master_objs[0].user_id = master_user.id

        db.add_all(
            [
                Booking(
                    buyer_id=buyer.id,
                    master_id=master_objs[0].id,
                    service="diagnostic",
                    booking_date=date(2026, 5, 18),
                    booking_time=time(10, 0),
                    phone="+996555123456",
                    problem="Не заводится, мигает лампа аккумулятора",
                    status=BookingStatus.confirmed,
                ),
                Booking(
                    buyer_id=buyer.id,
                    master_id=master_objs[0].id,
                    service="repair",
                    booking_date=date(2026, 6, 12),
                    booking_time=time(14, 0),
                    phone="+996555123456",
                    problem="Пропала зарядка, подозрение на генератор",
                    status=BookingStatus.pending,
                ),
            ]
        )
        db.add_all(
            [
                RepairRecord(
                    buyer_id=buyer.id,
                    master_id=master_objs[0].id,
                    title="Диагностика электрики",
                    cost=500,
                    repair_date=date(2026, 5, 10),
                ),
                RepairRecord(
                    buyer_id=buyer.id,
                    master_id=master_objs[2].id,
                    title="Замена генератора",
                    cost=3500,
                    repair_date=date(2026, 4, 22),
                    part_note="Генератор Toyota Camry",
                ),
            ]
        )
        db.commit()
        _seed_pending_submissions(db)
    finally:
        db.close()
