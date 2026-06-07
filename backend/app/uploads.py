import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from app.config import settings

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/heif": ".heif",
}


def ensure_upload_dir() -> Path:
    path = Path(settings.upload_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_upload_files(files: list[UploadFile]) -> list[str]:
    if not files:
        raise HTTPException(status_code=400, detail="Выберите хотя бы один файл")
    if len(files) > settings.max_upload_files:
        raise HTTPException(
            status_code=400,
            detail=f"Максимум {settings.max_upload_files} файлов за раз",
        )

    upload_dir = ensure_upload_dir()
    saved: list[str] = []
    max_bytes = settings.max_upload_size_mb * 1024 * 1024

    for f in files:
        content_type = (f.content_type or "").lower()
        ext = ALLOWED_CONTENT_TYPES.get(content_type)
        if not ext:
            raise HTTPException(status_code=400, detail=f"Недопустимый тип файла: {content_type or 'unknown'}")

        data = await f.read()
        if len(data) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"Файл слишком большой (макс. {settings.max_upload_size_mb} МБ)",
            )
        if len(data) == 0:
            continue

        name = f"{uuid.uuid4().hex}{ext}"
        (upload_dir / name).write_bytes(data)
        saved.append(name)

    if not saved:
        raise HTTPException(status_code=400, detail="Пустые файлы")
    return saved


def media_urls(filenames: list[str], base_url: str) -> list[str]:
    base = base_url.rstrip("/")
    return [f"{base}/api/media/{name}" for name in filenames]
