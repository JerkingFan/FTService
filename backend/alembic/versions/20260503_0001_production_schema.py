"""production schema baseline

Revision ID: 20260503_0001
Revises:
Create Date: 2026-05-03

"""
from typing import Sequence, Union

revision: str = "20260503_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Таблицы создаются через Base.metadata.create_all при старте.
    # Эта ревизия — точка отсчёта Alembic для продакшена (PostgreSQL).
    pass


def downgrade() -> None:
    pass
