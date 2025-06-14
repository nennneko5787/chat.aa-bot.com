import enum
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, computed_field, field_serializer

from .role import Role


class Status(enum.Enum):
    offline = "offline"
    do_not_disturb = "do_not_disturb"
    online = "online"


class Member(BaseModel):
    id: int
    createdAt: datetime = Field(alias="created_at")
    username: str
    displayName: Optional[str] = Field(None, alias="display_name")
    avatarUrl: Optional[str] = Field(None, alias="avatar_url")
    roles: List[Role] = []
    status: Status = Field(
        Status.offline,
        exclude=True,
    )

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


class Me(BaseModel):
    id: int
    createdAt: datetime = Field(alias="created_at")
    username: str
    displayName: Optional[str] = Field(None, alias="display_name")
    avatarUrl: Optional[str] = Field(None, alias="avatar_url")
    roles: List[Role] = []
    status: Status = Field(
        Status.offline,
        exclude=True,
    )
    email: EmailStr

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
