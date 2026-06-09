from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models import Part, PartStatus, User
from app.models.chat import ChatMessage, Conversation
from app.schemas.chat import (
    ChatMessageOut,
    ConversationCreate,
    ConversationOut,
    MessageCreate,
    UnreadCountOut,
)

router = APIRouter(prefix="/chat", tags=["chat"])


def _resolve_seller_id(db: Session, part: Part) -> int:
    if part.seller_id:
        return part.seller_id
    seller = db.scalar(select(User).where(User.email == "seller@test.kg"))
    if seller:
        return seller.id
    raise HTTPException(status_code=400, detail="Продавец недоступен для чата")


def _conversation_out(conv: Conversation, user: User) -> ConversationOut:
    is_buyer = user.id == conv.buyer_id
    peer = conv.seller if is_buyer else conv.buyer
    last_read = conv.buyer_last_read_at if is_buyer else conv.seller_last_read_at
    unread = 0
    if conv.messages:
        for msg in conv.messages:
            if msg.sender_id != user.id and (not last_read or msg.created_at > last_read):
                unread += 1
    last_msg = conv.messages[-1] if conv.messages else None
    return ConversationOut(
        id=conv.id,
        part_id=conv.part_id,
        part_title=conv.part_title,
        part_image_url=conv.part_image_url,
        peer_name=peer.full_name if peer else "Продавец",
        peer_id=peer.id if peer else 0,
        last_message=last_msg.body if last_msg else None,
        last_message_at=conv.updated_at,
        unread_count=unread,
    )


def _get_conversation_for_user(db: Session, conv_id: int, user: User) -> Conversation:
    conv = db.scalar(
        select(Conversation)
        .where(
            Conversation.id == conv_id,
            or_(Conversation.buyer_id == user.id, Conversation.seller_id == user.id),
        )
        .options(selectinload(Conversation.messages), selectinload(Conversation.buyer), selectinload(Conversation.seller))
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Диалог не найден")
    return conv


@router.get("/unread-count", response_model=UnreadCountOut)
def unread_count(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    convs = db.scalars(
        select(Conversation)
        .where(or_(Conversation.buyer_id == user.id, Conversation.seller_id == user.id))
        .options(selectinload(Conversation.messages))
    ).all()
    total = sum(_conversation_out(c, user).unread_count for c in convs)
    return UnreadCountOut(count=total)


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    convs = db.scalars(
        select(Conversation)
        .where(or_(Conversation.buyer_id == user.id, Conversation.seller_id == user.id))
        .options(
            selectinload(Conversation.messages),
            selectinload(Conversation.buyer),
            selectinload(Conversation.seller),
        )
        .order_by(Conversation.updated_at.desc())
    ).all()
    return [_conversation_out(c, user) for c in convs]


@router.post("/conversations", response_model=ConversationOut, status_code=201)
def start_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    part = db.get(Part, data.part_id)
    if not part or part.status != PartStatus.published:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    seller_id = _resolve_seller_id(db, part)
    if seller_id == user.id:
        raise HTTPException(status_code=400, detail="Нельзя написать самому себе")

    conv = db.scalar(
        select(Conversation)
        .where(Conversation.part_id == part.id, Conversation.buyer_id == user.id)
        .options(
            selectinload(Conversation.messages),
            selectinload(Conversation.buyer),
            selectinload(Conversation.seller),
        )
    )

    now = datetime.now(timezone.utc)
    if not conv:
        conv = Conversation(
            part_id=part.id,
            buyer_id=user.id,
            seller_id=seller_id,
            part_title=part.title,
            part_image_url=part.image_url,
            buyer_last_read_at=now,
            updated_at=now,
        )
        db.add(conv)
        db.flush()

    if data.message and data.message.strip():
        msg = ChatMessage(conversation_id=conv.id, sender_id=user.id, body=data.message.strip())
        db.add(msg)
        conv.updated_at = now

    db.commit()
    db.refresh(conv)
    conv = _get_conversation_for_user(db, conv.id, user)
    return _conversation_out(conv, user)


@router.get("/conversations/{conv_id}/messages", response_model=list[ChatMessageOut])
def list_messages(
    conv_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conv = _get_conversation_for_user(db, conv_id, user)
    now = datetime.now(timezone.utc)
    if user.id == conv.buyer_id:
        conv.buyer_last_read_at = now
    else:
        conv.seller_last_read_at = now
    db.commit()

    return [
        ChatMessageOut(
            id=m.id,
            conversation_id=m.conversation_id,
            sender_id=m.sender_id,
            body=m.body,
            created_at=m.created_at,
            is_mine=m.sender_id == user.id,
        )
        for m in conv.messages
    ]


@router.post("/conversations/{conv_id}/messages", response_model=ChatMessageOut, status_code=201)
def send_message(
    conv_id: int,
    data: MessageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    conv = _get_conversation_for_user(db, conv_id, user)
    now = datetime.now(timezone.utc)
    msg = ChatMessage(conversation_id=conv.id, sender_id=user.id, body=data.body.strip())
    db.add(msg)
    conv.updated_at = now
    if user.id == conv.buyer_id:
        conv.buyer_last_read_at = now
    else:
        conv.seller_last_read_at = now
    db.commit()
    db.refresh(msg)
    return ChatMessageOut(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        body=msg.body,
        created_at=msg.created_at,
        is_mine=True,
    )
