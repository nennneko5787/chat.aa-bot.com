import enum
from datetime import datetime
from typing import Dict

from pydantic import BaseModel, Field

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
