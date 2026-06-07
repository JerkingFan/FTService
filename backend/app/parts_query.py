from app.models import Part
from app.models.part import parse_fits


def matches_part(
    part: Part,
    q_lower: str,
    part_number: str | None,
    car_fit: str | None,
    location: str | None,
) -> bool:
    if part_number:
        pn = (part.part_number or "").lower()
        if part_number.lower() not in pn:
            return False
    if car_fit:
        cf = car_fit.lower()
        fits = part.fits if hasattr(part, "fits") else parse_fits(part.fits_json)
        hay = " ".join([part.car.lower(), part.title.lower(), " ".join(f.lower() for f in fits)])
        if cf not in hay:
            return False
    if location:
        loc = location.lower()
        if loc not in part.location.lower() and loc not in (part.address or "").lower():
            return False
    if q_lower:
        fits = part.fits if hasattr(part, "fits") else parse_fits(part.fits_json)
        hay = " ".join(
            [
                part.title.lower(),
                part.car.lower(),
                part.location.lower(),
                (part.part_number or "").lower(),
                (part.description or "").lower(),
                part.seller_name.lower(),
                " ".join(f.lower() for f in fits),
            ]
        )
        if q_lower not in hay:
            return False
    return True


def sort_parts(parts: list[Part], sort: str | None) -> list[Part]:
    if sort == "price_asc":
        return sorted(parts, key=lambda p: p.price)
    if sort == "price_desc":
        return sorted(parts, key=lambda p: p.price, reverse=True)
    return sorted(parts, key=lambda p: p.created_at, reverse=True)
