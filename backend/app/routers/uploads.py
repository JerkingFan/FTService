from fastapi import APIRouter, Depends, File, Request, UploadFile

from app.auth import get_current_user
from app.config import settings
from app.models import User
from app.schemas.engagement import UploadImagesOut
from app.uploads import media_urls, save_upload_files

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/images", response_model=UploadImagesOut)
async def upload_images(
    request: Request,
    files: list[UploadFile] = File(...),
    _: User = Depends(get_current_user),
):
    names = await save_upload_files(files)
    base = settings.public_base_url.strip() or str(request.base_url).rstrip("/")
    return UploadImagesOut(urls=media_urls(names, base))
