from datetime import datetime

from pydantic import BaseModel

from app.models.part import PartCondition, PartStatus
from app.schemas.part import PartOut, PartSubmissionOut


class SellerDashboardOut(BaseModel):
    submissions: list[PartSubmissionOut]
    published_parts: list[PartOut]
    pending_count: int
    published_count: int
