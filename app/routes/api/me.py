from fastapi import APIRouter, Depends, Request

from app.objects import Me
from app.services.user import loginCheck

router = APIRouter()


@router.get("/api/users/me")
async def loginPage(me: Me = Depends(loginCheck)):
    return me
