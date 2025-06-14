import os
import random
import uuid
from typing import Dict, List, Optional

import orjson
from cryptography.fernet import Fernet
from fastapi import Header, HTTPException

from app.objects import Me, Member, Status
from app.services.gateway import manager

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


async def loginCheck(authorization: Optional[str] = Header(default=None)) -> Me:
    member = await loginCheckNoneable(authorization)
    if not member:
        raise HTTPException(401)
    return member


async def loginCheckNoneable(
    authorization: Optional[str] = Header(default=None),
) -> Optional[Me]:
    if not authorization:
        return None

    userData: dict = orjson.loads(fernet.decrypt(authorization.encode()))
    if not userData.get("token"):
        return None

    cursor = await DBService.conn.execute(
        "SELECT * FROM tokenids WHERE id = ?", (userData["token"],)
    )
    row = await cursor.fetchone()
    if not row:
        return None

    row = dict(row)

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


async def getMember(id: int, *, me: bool = True):
    cursor = await DBService.conn.execute("SELECT * FROM members WHERE id = ?", (id,))
    row = await cursor.fetchone()
    if not row:
        return None
    member = await _get(dict(row), me)
    return member


async def getMembers():
    members = []
    cursor = await DBService.conn.execute("SELECT * FROM members")
    rows = await cursor.fetchall()
    if not rows:
        return []
    for row in rows:
        member = await _get(dict(row))
        members.append(member)
    return members


async def _get(row: Dict, me: bool = True):
    crow = row.copy()

    row["roles"] = []

    for roleId in orjson.loads(crow["roles"].encode()):
        cursor = await DBService.conn.execute(
            "SELECT * FROM roles WHERE id = ?", (roleId,)
        )
        roleRow = await cursor.fetchone()
        if not roleRow:
            continue
        roleRow = dict(roleRow)
        roleRow["permissions"] = orjson.loads(roleRow["permissions"])
        row["roles"].append(dict(roleRow))

    row["roles"].sort(key=lambda a: a["position"], reverse=True)

    user = (Me if me else Member).model_validate(dict(row))

    if manager.websocket.get(user.id):
        user.status = Status.online
    return user


async def userNameCheck(username: str):
    cursor = await DBService.conn.execute(
        "SELECT * FROM members WHERE username = ?", (username,)
    )
    row = await cursor.fetchone()
    if not row:
        return False
    return True


async def mailAddrCheck(email: str):
    cursor = await DBService.conn.execute(
        "SELECT * FROM members WHERE email = ?", (email,)
    )
    row = await cursor.fetchone()
    if not row:
        return False
    return True


async def updateMember(userId: int, *, roles: List[int] = None):
    if roles is not None:
        await DBService.conn.execute(
            """
            UPDATE members SET roles = ? WHERE id = ?
        """,
            (
                f"[{','.join(str(roleId) for roleId in roles)}]",
                userId,
            ),
        )
        await DBService.conn.commit()
