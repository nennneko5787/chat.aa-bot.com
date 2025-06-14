import enum
from datetime import datetime
from typing import Dict, Optional

from pydantic import BaseModel, Field, computed_field, field_serializer

from .permissions import PermissionOverwrites


class ChannelType(enum.Enum):
    text = "text"
    voice = "voice"


class Channel(BaseModel):
    id: int
    createdAt: datetime = Field(alias="created_at")
    name: str = Field(max_length=32)
    type: ChannelType
    overwrites: Dict[int, PermissionOverwrites] = {}
    topic: Optional[str] = None

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

    @field_serializer("type", check_fields=False)
    def type(self, ct: ChannelType):
        return ct.value
