from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="pages")


@router.get("/login", response_class=HTMLResponse)
async def loginPage(request: Request):
    return templates.TemplateResponse(
        request=request, name="login.html", context={"request": request}
    )


@router.get("/register", response_class=HTMLResponse)
async def registerPage(request: Request):
    return templates.TemplateResponse(
        request=request, name="register.html", context={"request": request}
    )


@router.get("/app", response_class=HTMLResponse)
async def appPage(request: Request):
    return templates.TemplateResponse(
        request=request, name="app.html", context={"request": request}
    )
