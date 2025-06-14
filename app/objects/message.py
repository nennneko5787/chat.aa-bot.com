from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, computed_field, field_serializer

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

    @computed_field
    @property
    def id_str(self) -> str:
        return str(self.id)

    @field_serializer("createdAt", check_fields=False)
    def isoformat(self, dt: datetime):
        return dt.isoformat()

    @field_serializer("created_at", check_fields=False)
    def isoformat2(self, dt: datetime):
        return dt.isoformat()
