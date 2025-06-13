from typing import Optional

from pydantic import BaseModel, Field


class Permissions(BaseModel):
    readMessageHistory: bool = Field(True, alias="read_message_history")
    sendMessages: bool = Field(True, alias="send_messages")
    reaction: bool = True
    mentionToUser: bool = Field(True, alias="mention_to_user")
    mentionToEveryone: bool = Field(True, alias="mention_to_everyone")
    connect: bool = True
    speak: bool = True
    admin: bool = False


class PermissionOverwrites(BaseModel):
    readMessageHistory: Optional[bool] = Field(None, alias="read_message_history")
    sendMessages: Optional[bool] = Field(None, alias="send_messages")
    reaction: Optional[bool] = None
    mentionToUser: Optional[bool] = Field(None, alias="mention_to_user")
    mentionToEveryone: Optional[bool] = Field(None, alias="mention_to_everyone")
    connect: Optional[bool] = None
    speak: Optional[bool] = None
