from dataclasses import asdict, dataclass, field
from fastapi import WebSocket


@dataclass
class ParticipantState:
    client_id: str
    display_name: str
    role: str
    is_muted: bool = False
    is_video_on: bool = True
    is_screen_sharing: bool = False

    def to_dict(self) -> dict:
        return asdict(self)


class ConnectionManager:
    """
    In-memory WebSocket room manager with participant metadata.

    rooms maps:  meeting_code -> { client_id: (WebSocket, ParticipantState) }

    MVP trade-off: state is lost on process restart.
    Production replacement: Redis pub/sub with a presence service.
    """

    def __init__(self) -> None:
        self.rooms: dict[str, dict[str, tuple[WebSocket, ParticipantState]]] = {}

    async def connect(
        self,
        meeting_code: str,
        client_id: str,
        websocket: WebSocket,
        participant: ParticipantState,
    ) -> None:
        self.rooms.setdefault(meeting_code, {})[client_id] = (websocket, participant)

    def disconnect(self, meeting_code: str, client_id: str) -> None:
        room = self.rooms.get(meeting_code)
        if room is not None:
            room.pop(client_id, None)
            if not room:
                del self.rooms[meeting_code]

    def get_participants(self, meeting_code: str) -> list[ParticipantState]:
        return [state for _, state in self.rooms.get(meeting_code, {}).values()]

    async def update_participant(
        self, meeting_code: str, client_id: str, **kwargs
    ) -> None:
        entry = self.rooms.get(meeting_code, {}).get(client_id)
        if entry:
            state = entry[1]
            for k, v in kwargs.items():
                setattr(state, k, v)

    async def broadcast(
        self, meeting_code: str, message: dict, exclude: str | None = None
    ) -> None:
        for cid, (ws, _) in list(self.rooms.get(meeting_code, {}).items()):
            if cid != exclude:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

    async def send_to(
        self, meeting_code: str, client_id: str, message: dict
    ) -> None:
        entry = self.rooms.get(meeting_code, {}).get(client_id)
        if entry:
            ws, _ = entry
            try:
                await ws.send_json(message)
            except Exception:
                pass


manager = ConnectionManager()
