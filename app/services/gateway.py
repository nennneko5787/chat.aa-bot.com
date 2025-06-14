from typing import Dict, List

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.connections: List[WebSocket] = []
        self.member: Dict[WebSocket, int] = {}
        self.websocket: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, userId: int):
        await websocket.accept()
        self.connections.append(websocket)
        self.member[websocket] = userId
        self.websocket[userId] = websocket

    def disconnect(self, websocket: WebSocket):
        self.connections.remove(websocket)
        del self.websocket[self.member[websocket]]
        del self.member[websocket]

    async def broadcast(self, data: Dict):
        for connection in self.connections:
            await connection.send_json(data)


manager = ConnectionManager()
