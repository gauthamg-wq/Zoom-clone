from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .manager import manager

router = APIRouter()


@router.websocket("/ws/{meeting_code}")
async def signaling_endpoint(websocket: WebSocket, meeting_code: str) -> None:
    """
    WebSocket endpoint for WebRTC signaling and room events.

    The server acts as a relay: it broadcasts every message from one participant
    to all others in the same room. Full event handling (join-room, offer, answer,
    ice-candidate, host controls) will be added in Phases 4–5.

    Supported client→server events (Phase 4-5):
        join-room, leave-room, offer, answer, ice-candidate,
        toggle-audio, toggle-video, screen-share-started, screen-share-stopped,
        mute-participant, remove-participant

    Server→client events (Phase 4-5):
        participant-joined, participant-left, offer, answer, ice-candidate,
        participant-audio-updated, participant-video-updated,
        host-muted-you, removed-from-meeting
    """
    client_id: str = websocket.headers.get("sec-websocket-key", str(id(websocket)))
    await manager.connect(meeting_code, client_id, websocket)
    try:
        while True:
            data: dict = await websocket.receive_json()
            event = data.get("event")

            await manager.broadcast(meeting_code, data, exclude=client_id)

            if event == "leave-room":
                break
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(meeting_code, client_id)
        await manager.broadcast(
            meeting_code,
            {"event": "participant-left", "clientId": client_id},
        )
