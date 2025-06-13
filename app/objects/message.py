from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from .channel import Channel
from .member import Member


class Message(BaseModel):
    id: int
    createdAt: datetime = Field(alias="created_at")
    editedAt: Optional[datetime] = Field(None, alias="edited_at")
    channel: Channel
    author: Member
    content: str
    attachments: List[str] = []
