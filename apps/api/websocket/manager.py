from fastapi import WebSocket


class ConnectionManager:
    """
    In-memory WebSocket room manager.

    rooms maps:  meeting_code  ->  { client_id: WebSocket }

    MVP trade-off: state is lost on process restart.
    Production replacement: Redis pub/sub with a presence service.
    """

    def __init__(self) -> None:
        self.rooms: dict[str, dict[str, WebSocket]] = {}

    async def connect(self, meeting_code: str, client_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.rooms.setdefault(meeting_code, {})[client_id] = websocket

    def disconnect(self, meeting_code: str, client_id: str) -> None:
        room = self.rooms.get(meeting_code)
        if room is not None:
            room.pop(client_id, None)
            if not room:
                del self.rooms[meeting_code]

    async def broadcast(
        self, meeting_code: str, message: dict, exclude: str | None = None
    ) -> None:
        """Send a message to every participant in the room except the sender."""
        for cid, ws in list(self.rooms.get(meeting_code, {}).items()):
            if cid != exclude:
                await ws.send_json(message)

    async def send_to(self, meeting_code: str, client_id: str, message: dict) -> None:
        """Send a message to a specific participant."""
        ws = self.rooms.get(meeting_code, {}).get(client_id)
        if ws is not None:
            await ws.send_json(message)


manager = ConnectionManager()
