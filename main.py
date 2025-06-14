from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import ORJSONResponse
from fastapi.staticfiles import StaticFiles

from app.routes import *
from app.services.db import DBService


@asynccontextmanager
async def lifespan(app: FastAPI):
    await DBService.init()
    yield
    await DBService.conn.close()


app = FastAPI(
    title="Ikocord",
    summary="いここーどAPIドキュメント",
    version="2025.06.13",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(pages.router)
app.include_router(users.router)
app.include_router(register.router)
app.include_router(login.router)
app.include_router(channels.router)
app.include_router(roles.router)
app.include_router(gateway.router)
