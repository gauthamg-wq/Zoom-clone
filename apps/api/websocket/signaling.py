from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.database import SessionLocal
from app import models
from .manager import ParticipantState, manager

router = APIRouter()


def _is_host(meeting_code: str, client_id: str) -> bool:
    entry = manager.rooms.get(meeting_code, {}).get(client_id)
    return entry is not None and entry[1].role == "host"


@router.websocket("/ws/{meeting_code}")
async def signaling_endpoint(
    websocket: WebSocket,
    meeting_code: str,
    client_id: str = Query(...),
) -> None:
    """
    WebSocket signaling endpoint.

    The client must send a `join-room` event immediately after connecting.
    Until that event is received the participant is not visible to other clients.

    URL: /ws/{meeting_code}?client_id=<uuid>
    """
    await websocket.accept()
    joined = False

    try:
        while True:
            data: dict = await websocket.receive_json()
            event: str = data.get("event", "")

            match event:
                # ── Room join ────────────────────────────────────────────────
                case "join-room":
                    participant = ParticipantState(
                        client_id=client_id,
                        display_name=data.get("displayName", "Participant"),
                        role=data.get("role", "participant"),
                    )
                    await manager.connect(meeting_code, client_id, websocket, participant)
                    joined = True

                    existing = manager.get_participants(meeting_code)
                    await manager.send_to(
                        meeting_code,
                        client_id,
                        {
                            "event": "existing-participants",
                            "participants": [
                                p.to_dict()
                                for p in existing
                                if p.client_id != client_id
                            ],
                        },
                    )
                    await manager.broadcast(
                        meeting_code,
                        {
                            "event": "participant-joined",
                            "clientId": client_id,
                            "displayName": participant.display_name,
                            "role": participant.role,
                        },
                        exclude=client_id,
                    )

                case "leave-room":
                    break

                # ── WebRTC peer-to-peer routing ──────────────────────────────
                case "offer" | "answer" | "ice-candidate":
                    target = data.get("targetClientId")
                    if target:
                        await manager.send_to(
                            meeting_code,
                            target,
                            {**data, "clientId": client_id},
                        )

                # ── Media state ──────────────────────────────────────────────
                case "toggle-audio":
                    is_muted: bool = bool(data.get("isMuted", False))
                    await manager.update_participant(
                        meeting_code, client_id, is_muted=is_muted
                    )
                    await manager.broadcast(
                        meeting_code,
                        {
                            "event": "participant-audio-updated",
                            "clientId": client_id,
                            "isMuted": is_muted,
                        },
                        exclude=client_id,
                    )

                case "toggle-video":
                    is_video_on: bool = bool(data.get("isVideoOn", True))
                    await manager.update_participant(
                        meeting_code, client_id, is_video_on=is_video_on
                    )
                    await manager.broadcast(
                        meeting_code,
                        {
                            "event": "participant-video-updated",
                            "clientId": client_id,
                            "isVideoOn": is_video_on,
                        },
                        exclude=client_id,
                    )

                case "screen-share-started":
                    await manager.update_participant(
                        meeting_code, client_id, is_screen_sharing=True
                    )
                    await manager.broadcast(
                        meeting_code,
                        {"event": "screen-share-started", "clientId": client_id},
                        exclude=client_id,
                    )

                case "screen-share-stopped":
                    await manager.update_participant(
                        meeting_code, client_id, is_screen_sharing=False
                    )
                    await manager.broadcast(
                        meeting_code,
                        {"event": "screen-share-stopped", "clientId": client_id},
                        exclude=client_id,
                    )

                # ── Host controls ────────────────────────────────────────────
                case "mute-participant":
                    if not _is_host(meeting_code, client_id):
                        await manager.send_to(
                            meeting_code, client_id,
                            {"event": "error", "message": "Not authorized"}
                        )
                        continue
                    target = data.get("targetClientId")
                    if target:
                        await manager.update_participant(
                            meeting_code, target, is_muted=True
                        )
                        await manager.send_to(
                            meeting_code, target,
                            {"event": "host-muted-you", "by": client_id}
                        )
                        # Notify whole room so all tiles update
                        await manager.broadcast(
                            meeting_code,
                            {
                                "event": "participant-audio-updated",
                                "clientId": target,
                                "isMuted": True,
                            },
                        )

                case "mute-all":
                    if not _is_host(meeting_code, client_id):
                        continue
                    for pid, (ws, state) in list(
                        manager.rooms.get(meeting_code, {}).items()
                    ):
                        if pid != client_id:
                            state.is_muted = True
                            try:
                                await ws.send_json(
                                    {"event": "host-muted-you", "by": client_id}
                                )
                            except Exception:
                                pass
                    await manager.broadcast(
                        meeting_code,
                        {"event": "all-muted", "by": client_id},
                    )

                case "remove-participant":
                    if not _is_host(meeting_code, client_id):
                        await manager.send_to(
                            meeting_code, client_id,
                            {"event": "error", "message": "Not authorized"}
                        )
                        continue
                    target = data.get("targetClientId")
                    if target:
                        await manager.send_to(
                            meeting_code, target,
                            {"event": "removed-from-meeting"}
                        )
                        manager.disconnect(meeting_code, target)
                        await manager.broadcast(
                            meeting_code,
                            {"event": "participant-left", "clientId": target},
                        )

                case "end-meeting":
                    if not _is_host(meeting_code, client_id):
                        continue
                    # Update DB status
                    try:
                        with SessionLocal() as db:
                            meeting = (
                                db.query(models.Meeting)
                                .filter_by(meeting_code=meeting_code)
                                .first()
                            )
                            if meeting:
                                meeting.status = "ended"
                                db.commit()
                    except Exception:
                        pass
                    # Notify all clients including the host
                    await manager.broadcast(
                        meeting_code,
                        {"event": "meeting-ended", "by": client_id},
                    )
                    # Clean up room
                    for pid in list(manager.rooms.get(meeting_code, {}).keys()):
                        manager.disconnect(meeting_code, pid)

    except WebSocketDisconnect:
        pass
    finally:
        if joined:
            manager.disconnect(meeting_code, client_id)
            await manager.broadcast(
                meeting_code,
                {"event": "participant-left", "clientId": client_id},
            )
