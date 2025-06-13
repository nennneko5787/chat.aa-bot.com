import bcrypt
import dotenv
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.objects import Me
from app.services.db import DBService
from app.services.user import _get, generateMemberToken

dotenv.load_dotenv()

router = APIRouter()


class Login(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str
    nonstress: str


@router.post("/api/auth/login")
async def login(model: Login):
    async with httpx.AsyncClient() as http:
        response = await http.post(
            "https://hamutan86.pythonanywhere.com/nonstress/validate",
            json={"token": model.nonstress},
        )
        jsonData = response.json()
        if not jsonData["pass"]:
            raise HTTPException(403)

    cursor = await DBService.conn.execute(
        "SELECT * FROM members WHERE username = ?", (model.username,)
    )
    row = await cursor.fetchone()
    if not row:
        raise HTTPException(400, "ユーザーネームまたはパスワードが違います")

    if not bcrypt.checkpw(model.password.encode(), row["password"].encode()):
        raise HTTPException(400, "ユーザーネームまたはパスワードが違います")

    me = await _get(dict(row))
    token = await generateMemberToken(me)
    return {"token": token, "me": me, "success": True}
