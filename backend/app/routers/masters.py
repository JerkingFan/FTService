from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.geo import haversine_km
from app.models import Master
from app.schemas.common import PaginatedResponse, paginate_list
from app.schemas.master import MasterOut

router = APIRouter(prefix="/masters", tags=["masters"])


def _query_masters(
    db: Session,
    q: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
    radius_km: float = 25,
) -> list[MasterOut]:
    masters = db.scalars(
        select(Master).where(Master.is_active == True).order_by(Master.rating.desc())
    ).all()

    if q:
        q_lower = q.lower()
        masters = [m for m in masters if q_lower in m.name.lower() or q_lower in m.spec.lower()]

    results: list[MasterOut] = []
    for m in masters:
        dist = None
        if lat is not None and lng is not None and m.latitude is not None and m.longitude is not None:
            dist = round(haversine_km(lat, lng, m.latitude, m.longitude), 1)
            if dist > radius_km:
                continue
        results.append(MasterOut.from_orm_master(m, distance_km=dist))

    if lat is not None and lng is not None:
        results.sort(key=lambda x: (x.distance_km is None, x.distance_km or 9999))

    return results


@router.get("", response_model=PaginatedResponse[MasterOut])
def list_masters(
    q: str | None = None,
    lat: float | None = Query(default=None, ge=-90, le=90),
    lng: float | None = Query(default=None, ge=-180, le=180),
    radius_km: float = Query(default=25, ge=1, le=100),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    results = _query_masters(db, q=q, lat=lat, lng=lng, radius_km=radius_km)
    slice_, total = paginate_list(results, page, limit)
    return PaginatedResponse.build(slice_, total, page, limit)


@router.get("/nearby", response_model=list[MasterOut])
def nearby_masters(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(default=15, ge=1, le=100),
    limit: int = Query(default=10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return _query_masters(db, lat=lat, lng=lng, radius_km=radius_km)[:limit]


@router.get("/{master_id}", response_model=MasterOut)
def get_master(master_id: int, db: Session = Depends(get_db)):
    m = db.get(Master, master_id)
    if not m or not m.is_active:
        raise HTTPException(status_code=404, detail="Мастер не найден")
    return MasterOut.from_orm_master(m)
