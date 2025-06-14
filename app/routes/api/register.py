import asyncio
import os
import re
import traceback
import uuid
from email.message import EmailMessage
from typing import Dict, List

import bcrypt
import dotenv
import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr, Field
from snowflake import SnowflakeGenerator

from app.services.db import DBService
from app.services.email import sendEMail
from app.services.user import mailAddrCheck, userNameCheck

dotenv.load_dotenv()

router = APIRouter()


class Register(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    email: EmailStr
    password: str
    nonstress: str


mail: Dict[str, Register] = {}
addrs: List[str] = []


@router.post("/api/auth/register")
async def register(backgroundTasks: BackgroundTasks, model: Register):
    async with httpx.AsyncClient() as http:
        response = await http.post(
            "https://hamutan86.pythonanywhere.com/nonstress/validate",
            json={"token": model.nonstress},
        )
        jsonData = response.json()
        if not jsonData["pass"]:
            raise HTTPException(403)

    if re.search(r"[^a-zA-Z0-9_.-]", model.username):
        raise HTTPException(
            400, "無効な文字が含まれています（英数字と _ . - のみ使用可能）"
        )

    if await userNameCheck(model.username):
        raise HTTPException(400, "ユーザーネームはすでに使用されています。")

    if await mailAddrCheck(model.email) or model.email in addrs:
        raise HTTPException(400, "メールアドレスはすでに使用されています。")

    salt = bcrypt.gensalt(rounds=10, prefix=b"2a")
    model.password = bcrypt.hashpw(model.password.encode(), salt).decode()

    token = str(uuid.uuid4())

    try:
        message = EmailMessage()
        message["From"] = os.getenv("smtp_email")
        message["To"] = model.email
        message["Subject"] = "[メールアドレスを認証してください] Welcome to Ikocord!"
        body = f"""Ikocordに仮登録いただき、誠にありがとうございます。。
Ikocordの登録を受け付けました。
お客様がご自身で行われた操作である場合は、以下のURLにアクセスして、アカウントの登録を完了してください。

http://localhost/email-verify/{token}
※URLの有効期限は5分です。

Ikocordから、自動送信されています。
このメールの発信元に発信されてもメールは届きません。

【重要】
当社がSNSを通じてお客様から確認コードをお聞きすることは、ございません。
このメールに心当たりのない場合、第三者がお客様のメールアドレスとパスワードを使用してログインを試みている可能性があります。
Ikocord で直ちにパスワードの変更を行っていただけますようお願いいたします。

Ikocord
https://localhost/app
"""
        message.set_content(body, charset="utf-8")
        await sendEMail(message)
    except Exception:
        traceback.print_exc()
        raise HTTPException(
            500,
            "認証コードの送信に失敗しました。サポートに連絡してください。",
        )

    addrs.append(model.email)
    mail[token] = model

    async def after():
        for _ in range(300):
            if not mail.get(token):
                return
            await asyncio.sleep(1)

        del mail[token]
        addrs.remove(model.email)

    backgroundTasks.add_task(after)

    return {
        "detail": "メールを送信しました。5分以内にメール内のURLにアクセスし、登録を完了してください。"
    }


@router.get(
    "/email-verify/{token}",
)
async def validate(token: str):
    model = mail.get(token)

    if not model:
        raise HTTPException(400, "そのメールアドレスにはURLを送信していません。")

    del mail[token]
    addrs.remove(model.email)

    gen = SnowflakeGenerator(5)
    id = next(gen)

    await DBService.conn.execute(
        """
        INSERT INTO members (
            id,
            username,
            email,
            password
        ) VALUES (?, ?, ?, ?)
    """,
        (
            id,
            model.username,
            model.email,
            model.password,
        ),
    )
    await DBService.conn.commit()

    return (
        "認証に成功しました。登録されたユーザー名とパスワードでログインしてください。"
    )
