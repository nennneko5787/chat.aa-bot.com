from typing import Optional

from pydantic import BaseModel, Field
from pydantic_extra_types.color import Color

from .permissions import Permissions


class Role(BaseModel):
    id: int
    name: str = Field(max_length=32)
    color: Optional[Color] = None
    isGrad: bool = Field(False, alias="is_grad")
    secondaryColor: Optional[Color] = Field(None, alias="secondary_color")
    permissions: Permissions = Permissions()
    iconUrl: Optional[str] = Field(None, alias="icon_url")
    position: int = Field(0, ge=0)
