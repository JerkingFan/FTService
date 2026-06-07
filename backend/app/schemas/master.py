from pydantic import BaseModel


class MasterOut(BaseModel):
    id: int
    name: str
    spec: str
    exp: str
    rating: float
    jobs: int
    district: str
    address: str | None = None
    phone: str | None = None
    telegram: str | None = None
    working_hours: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    priceFrom: int
    distance_km: float | None = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_master(cls, m, distance_km: float | None = None) -> "MasterOut":
        return cls(
            id=m.id,
            name=m.name,
            spec=m.spec,
            exp=m.experience,
            rating=m.rating,
            jobs=m.jobs_count,
            district=m.district,
            address=m.address,
            phone=m.phone,
            telegram=m.telegram,
            working_hours=m.working_hours,
            latitude=m.latitude,
            longitude=m.longitude,
            priceFrom=m.price_from,
            distance_km=distance_km,
        )
