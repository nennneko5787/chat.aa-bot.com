from typing import List

import dotenv
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field

from app.objects import Channel, ChannelType, Me, Message
from app.services.channel import (
    createChannel,
    getChannel,
    getChannels,
    getMessages,
    sendMessage,
)
from app.services.gateway import manager
from app.services.user import loginCheck

dotenv.load_dotenv()

router = APIRouter()


@router.get("/api/channels")
async def channels(member: Me = Depends(loginCheck)) -> List[Channel]:
    channels = await getChannels()
    return channels


class CreateChannel(BaseModel):
    name: str = Field(min_length=1, max_length=32)
    topic: str


@router.post("/api/channels")
async def create(model: CreateChannel, me: Me = Depends(loginCheck)):
    isAdmin = False
    for role in me.roles:
        if role.permissions.admin:
            isAdmin = True
            break

    if not isAdmin:
        raise HTTPException(403)

    channel = await createChannel(
        name=model.name, topic=model.topic, type=ChannelType.text
    )
    return {"success": True, "channel": channel}


@router.get("/api/channels/{channelId:int}/messages")
async def messages(
    channelId: int, page=0, me: Me = Depends(loginCheck)
) -> List[Message]:
    return await getMessages(me, await getChannel(channelId), page=page)


class SendMessage(BaseModel):
    content: str = Field(min_length=0, max_length=2024)


@router.post("/api/channels/{channelId:int}/messages")
async def send(
    tasks: BackgroundTasks,
    channelId: int,
    model: SendMessage,
    me: Me = Depends(loginCheck),
) -> Message:
    message = await sendMessage(me, await getChannel(channelId), content=model.content)

    async def after():
        await manager.broadcast(
            {"type": "message", "message": message.model_dump(by_alias=True)}
        )

    tasks.add_task(after)
    return message
