from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.objects import Me
from app.services.user import getMembers, loginCheck, updateMember

router = APIRouter()


@router.get("/api/users")
async def users(me: Me = Depends(loginCheck)):
    users = await getMembers()
    return users


@router.get("/api/users/me")
async def me(me: Me = Depends(loginCheck)):
    return me


class Update(BaseModel):
    roles: Optional[List[int]] = None


@router.patch("/api/users/{userId:str}/roles")
async def updateRoles(userId: str, model: Update, me: Me = Depends(loginCheck)):
    isAdmin = False
    for role in me.roles:
        if role.permissions.admin:
            isAdmin = True
            break

    if not isAdmin:
        raise HTTPException(403)

    await updateMember(userId, roles=[roleId for roleId in model.roles])
    return {"success": True, "detail": "ロールの変更に成功しました。"}
