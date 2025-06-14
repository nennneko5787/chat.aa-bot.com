from typing import List

import orjson
from fastapi import HTTPException
from snowflake import SnowflakeGenerator

from app.objects import Channel, ChannelType, Member, Message
from app.services.db import DBService

from .user import getMember


async def getChannel(channelId: int) -> List[Channel]:
    cursor = await DBService.conn.execute(
        "SELECT * FROM channels WHERE id = ?", (channelId,)
    )
    row = await cursor.fetchone()

    row = dict(row)
    row["overwrites"] = orjson.loads(row["overwrites"])
    channel = Channel.model_validate(row)

    return channel


async def getChannels() -> List[Channel]:
    channels: List[Channel] = []

    cursor = await DBService.conn.execute("SELECT * FROM channels")
    rows = await cursor.fetchall()

    for row in rows:
        row = dict(row)
        row["overwrites"] = orjson.loads(row["overwrites"])
        channel = Channel.model_validate(row)
        channels.append(channel)

    return channels


async def getMessages(member: Member, channel: Channel, page: int = 0) -> List[Message]:
    messages: List[Message] = []

    if len(channel.overwrites.keys()) == 0:
        readable: List[bool] = []
        for role in member.roles:
            readable.append(role.permissions.readMessageHistory)
        if len(member.roles) > 0 and True not in readable:
            raise HTTPException(403)
    else:
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
        "SELECT * FROM messages WHERE channel_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?",
        (channel.id, limit, offset),
    )
    rows = await cursor.fetchall()

    for row in rows:
        row = dict(row)
        row["author"] = await getMember(row["author_id"], me=False)
        row["channel"] = channel
        row["attachments"] = orjson.loads(row["attachments"])
        message = Message.model_validate(row, from_attributes=True)
        messages.append(message)

    return messages


async def createChannel(*, name: str, type: ChannelType, topic: str = None):
    gen = SnowflakeGenerator(5)
    channelId = next(gen)

    cursor = await DBService.conn.execute(
        """
        INSERT INTO channels (
            id,
            name,
            topic,
            type
        ) VALUES (?, ?, ?, ?)
        RETURNING *
    """,
        (
            channelId,
            name,
            topic,
            type.value,
        ),
    )
    row = await cursor.fetchone()
    await DBService.conn.commit()

    row = dict(row)
    row["overwrites"] = orjson.loads(row["overwrites"])

    return Channel.model_validate(row, from_attributes=True)


async def sendMessage(member: Member, channel: Channel, *, content: str):
    if len(channel.overwrites.keys()) == 0:
        readable: List[bool] = []
        for role in member.roles:
            readable.append(
                role.permissions.sendMessages and role.permissions.readMessageHistory
            )
        if len(member.roles) > 0 and True not in readable:
            raise HTTPException(403)
    else:
        readable: List[bool] = []
        for id, overwrites in channel.overwrites.items():
            if member.id == id:
                readable.append(
                    overwrites.sendMessages and overwrites.readMessageHistory
                )
            for role in member.roles:
                if role.id == id:
                    readable.append(
                        overwrites.sendMessages and overwrites.readMessageHistory
                    )

        if True not in readable:
            raise HTTPException(403)

    gen = SnowflakeGenerator(5)
    messageId = next(gen)

    cursor = await DBService.conn.execute(
        """
        INSERT INTO messages (
            id,
            author_id,
            channel_id,
            content
        ) VALUES (?, ?, ?, ?)
        RETURNING *
    """,
        (
            messageId,
            member.id,
            channel.id,
            content,
        ),
    )
    row = await cursor.fetchone()
    await DBService.conn.commit()

    row = dict(row)
    row["author"] = await getMember(row["author_id"], me=False)
    row["channel"] = channel
    row["attachments"] = orjson.loads(row["attachments"])

    return Message.model_validate(row, from_attributes=True)
