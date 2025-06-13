from typing import List

from fastapi import HTTPException

from app.objects import Channel, Member, Message
from app.services.db import DBService

from .user import getMember


async def getChannels() -> List[Channel]:
    channels: List[Channel] = []

    cursor = await DBService.conn.execute("SELECT * FROM channels")
    rows = await cursor.fetchall()

    for row in rows:
        channel = Channel.model_validate(row)
        channels.append(channel)

    return channels


async def getMessages(member: Member, channel: Channel, page: int = 0) -> List[Message]:
    messages: List[Message] = []

    readable: List[bool] = []
    for id, overwrites in channel.overwrites.items():
        if member.id == id:
            readable.append(overwrites.readMessageHistory)
        for role in member.roles:
            if role.id == id:
                readable.append(overwrites.readMessageHistory)

    if True not in readable:
        raise HTTPException(403)

    limit = 50
    offset = (page - 1) * limit

    cursor = await DBService.conn.execute(
        "SELECT * FROM messages WHERE channel_id = ? LIMIT ? OFFSET ?",
        (channel.id, limit, offset),
    )
    rows = await cursor.fetchall()

    for row in rows:
        row["author"] = getMember(row["author_id"])
        row["channel"] = channel
        message = Message.model_validate(row)
        messages.append(message)

    return messages
