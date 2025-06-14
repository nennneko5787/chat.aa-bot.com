import dotenv
from fastapi import APIRouter, Depends

from app.objects import Me
from app.services.role import getRoles
from app.services.user import loginCheck

dotenv.load_dotenv()

router = APIRouter()


@router.get("/api/roles")
async def roles(member: Me = Depends(loginCheck)):
    roles = await getRoles()
    return roles
