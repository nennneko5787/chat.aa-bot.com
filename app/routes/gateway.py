from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.services.gateway import manager
from app.services.user import getMember, loginCheckNoneable

router = APIRouter()


@router.websocket("/gateway/{token}")
async def gateway(websocket: WebSocket, token: str):
    me = await loginCheckNoneable(token)
    if not me:
        raise HTTPException(403)
    user = await getMember(me.id, me=False)

    await manager.connect(websocket, me.id)
    try:
        await manager.broadcast(
            {"type": "online", "user": user.model_dump(by_alias=True)}
        )

        while True:
            data = await websocket.receive_json()
            print(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(
            {"type": "offline", "user": user.model_dump(by_alias=True)}
        )
