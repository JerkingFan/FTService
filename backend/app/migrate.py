"""Добавление новых колонок в существующую SQLite БД."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def _column_names(engine: Engine, table: str) -> set[str]:
    insp = inspect(engine)
    return {c["name"] for c in insp.get_columns(table)}


def _add_column(engine: Engine, table: str, ddl: str) -> None:
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {ddl}"))


def run_migrations(engine: Engine) -> None:
    insp = inspect(engine)
    if not insp.has_table("parts"):
        return

    parts_cols = _column_names(engine, "parts")
    part_additions = [
        ("part_number", "part_number VARCHAR(64)"),
        ("fits_json", "fits_json TEXT"),
        ("phone", "phone VARCHAR(32)"),
        ("working_hours", "working_hours VARCHAR(120)"),
        ("address", "address VARCHAR(255)"),
        ("images_json", "images_json TEXT"),
        ("attributes_json", "attributes_json TEXT"),
    ]
    for name, ddl in part_additions:
        if name not in parts_cols:
            _add_column(engine, "parts", ddl)

    if insp.has_table("part_submissions"):
        sub_cols = _column_names(engine, "part_submissions")
        for name, ddl in [
            ("part_number", "part_number VARCHAR(64)"),
            ("fits_json", "fits_json TEXT"),
            ("user_id", "user_id INTEGER"),
            ("images_json", "images_json TEXT"),
        ]:
            if name not in sub_cols:
                _add_column(engine, "part_submissions", ddl)

    if insp.has_table("masters"):
        master_cols = _column_names(engine, "masters")
        for name, ddl in [
            ("phone", "phone VARCHAR(32)"),
            ("telegram", "telegram VARCHAR(64)"),
            ("working_hours", "working_hours VARCHAR(120)"),
            ("address", "address VARCHAR(255)"),
            ("latitude", "latitude FLOAT"),
            ("longitude", "longitude FLOAT"),
        ]:
            if name not in master_cols:
                _add_column(engine, "masters", ddl)
