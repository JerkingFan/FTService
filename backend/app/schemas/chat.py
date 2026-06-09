from datetime import datetime

from pydantic import BaseModel, Field


class ChatMessageOut(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    body: str
    created_at: datetime
    is_mine: bool = False

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: int
    part_id: int
    part_title: str
    part_image_url: str | None = None
    peer_name: str
    peer_id: int
    last_message: str | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    part_id: int
    message: str | None = Field(default=None, max_length=2000)


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class UnreadCountOut(BaseModel):
    count: int
