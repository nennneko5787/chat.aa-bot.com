from typing import List

import orjson

from app.objects import Role
from app.services.db import DBService


async def getRoles() -> List[Role]:
    roles: List[Role] = []

    cursor = await DBService.conn.execute("SELECT * FROM roles")
    rows = await cursor.fetchall()

    for row in rows:
        row = dict(row)
        row["permissions"] = orjson.loads(row["permissions"])
        role = Role.model_validate(row)
        roles.append(role)

    return roles
