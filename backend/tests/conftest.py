import pytest

from app.database import Base, engine
from app.models import (  # noqa: F401
    Booking,
    FavoriteMaster,
    FavoritePart,
    Master,
    Part,
    PartSubmission,
    RepairRecord,
    SavedSearch,
    User,
    ViewedPart,
)
from app.migrate import run_migrations
from app.seed import seed_database


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    run_migrations(engine)
    seed_database()
