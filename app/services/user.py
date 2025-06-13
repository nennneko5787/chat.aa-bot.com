import os
import random
import uuid
from typing import Dict, Optional

import orjson
from cryptography.fernet import Fernet
from fastapi import Cookie

from app.objects import Me, Member

from .db import DBService

fernet = Fernet(os.getenv("key").encode())


async def generateMemberToken(member: Me) -> str:
    token = str(uuid.uuid4())
    await DBService.conn.execute(
        "INSERT INTO tokenids (id, member_id) VALUES (?, ?)", (token, member.id)
    )
    await DBService.conn.commit()
    return fernet.encrypt(
        orjson.dumps(
            {
                random.choice(
                    ["miku", "rin", "len", "gumi", "kaito", "ruka", "meiko"]
                ): random.choice(["cute", "love"]),
                "token": token,
            }
        )
    ).decode()


async def loginCheck(token: Optional[str] = Cookie(default=None)) -> Me:
    return await loginCheckNoneable(token)


async def loginCheckNoneable(
    token: Optional[str] = Cookie(default=None),
) -> Optional[Me]:
    if not token:
        return None

    userData: dict = orjson.loads(fernet.decrypt(token.encode()))
    if not userData.get("token"):
        return None

    cursor = await DBService.conn.execute(
        "SELECT * FROM tokenids WHERE id = ?", (userData["token"],)
    )
    row = dict(await cursor.fetchone())
    if not row.get("member_id"):
        return None

    cursor = await DBService.conn.execute(
        "SELECT * FROM members WHERE id = ?", (row["member_id"],)
    )
    row = await cursor.fetchone()
    if not row:
        return None

    user = await _get(dict(row))

    return user


async def getMember(id: int):
    cursor = await DBService.conn.execute("SELECT * FROM members WHERE id = ?", (id,))
    row = await cursor.fetchone()
    if not row:
        return None
    user = await _get(dict(row))
    return user


async def _get(row: Dict):
    crow = row.copy()

    row["roles"] = []

    for roleId in orjson.loads(crow["roles"].encode()):
        cursor = await DBService.conn.execute(
            "SELECT * FROM roles WHERE id = ?", (roleId,)
        )
        roleRow = await cursor.fetchone()
        if not roleRow:
            continue
        row["roles"].append(dict(roleRow))

    row["roles"].sort(key=lambda a: a["position"], reverse=True)

    user = Me.model_validate(dict(row))
    return user


async def userNameCheck(username: str):
    cursor = await DBService.conn.execute(
        "SELECT * FROM members WHERE username = ?", (username,)
    )
    row = await cursor.fetchone()
    if not row:
        return False
    return True
