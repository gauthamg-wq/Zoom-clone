# Phase 7 — Host Controls: Mute, Remove, End Meeting

## Goal

Give the host power over the meeting: mute individual participants, mute all, remove participants, and end the meeting for everyone. All host actions are enforced by the backend (the server checks the sender's role before routing the command).

---

## Feature Breakdown

| Control            | Host action                             | Server action                                                               | Participant receives   |
| ------------------ | --------------------------------------- | --------------------------------------------------------------------------- | ---------------------- |
| Mute participant   | `mute-participant` + `targetClientId`   | Verify sender is host → `send_to` target                                    | `host-muted-you`       |
| Remove participant | `remove-participant` + `targetClientId` | Verify sender is host → `send_to` target                                    | `removed-from-meeting` |
| Mute all           | `mute-all`                              | Verify sender is host → `broadcast` (excluding host)                        | `host-muted-you`       |
| End meeting        | `end-meeting`                           | Verify sender is host → `PATCH /meetings/{code} status=ended` → `broadcast` | `meeting-ended`        |

---

## Backend Changes

### `apps/api/websocket/signaling.py`

Add a helper to check host role:

```python
def _get_participant_state(manager, meeting_code, client_id):
    entry = manager.rooms.get(meeting_code, {}).get(client_id)
    return entry[1] if entry else None

def _is_host(manager, meeting_code, client_id) -> bool:
    state = _get_participant_state(manager, meeting_code, client_id)
    return state is not None and state.role == "host"
```

Add handlers for each host event in the dispatch block:

```python
case "mute-participant":
    if not _is_host(manager, meeting_code, client_id):
        await manager.send_to(meeting_code, client_id, {"event": "error", "message": "Not authorized"})
        continue
    target = data.get("targetClientId")
    await manager.send_to(meeting_code, target, {"event": "host-muted-you", "by": client_id})
    # Also update target's ParticipantState so new joiners see correct mute status
    await manager.update_participant(meeting_code, target, is_muted=True)
    # Notify room
    await manager.broadcast(meeting_code, {
        "event": "participant-audio-updated",
        "clientId": target,
        "isMuted": True,
    })

case "remove-participant":
    if not _is_host(manager, meeting_code, client_id):
        await manager.send_to(meeting_code, client_id, {"event": "error", "message": "Not authorized"})
        continue
    target = data.get("targetClientId")
    await manager.send_to(meeting_code, target, {"event": "removed-from-meeting"})
    # Disconnect target
    manager.disconnect(meeting_code, target)
    await manager.broadcast(meeting_code, {"event": "participant-left", "clientId": target})

case "mute-all":
    if not _is_host(manager, meeting_code, client_id):
        continue
    for pid, (ws, state) in list(manager.rooms.get(meeting_code, {}).items()):
        if pid != client_id:  # don't mute the host
            await ws.send_json({"event": "host-muted-you", "by": client_id})
            state.is_muted = True
    await manager.broadcast(meeting_code, {"event": "all-muted", "by": client_id})

case "end-meeting":
    if not _is_host(manager, meeting_code, client_id):
        continue
    # Update DB status via REST (call meeting_service.end_meeting or direct DB update)
    # For simplicity in WebSocket context: import db session inside the handler
    # Or: call the HTTP endpoint internally (less clean) — prefer direct DB call
    with SessionLocal() as db:
        meeting = db.query(Meeting).filter_by(meeting_code=meeting_code).first()
        if meeting:
            meeting.status = "ended"
            db.commit()
    await manager.broadcast(meeting_code, {"event": "meeting-ended", "by": client_id})
    # Disconnect everyone
    for pid in list(manager.rooms.get(meeting_code, {}).keys()):
        manager.disconnect(meeting_code, pid)
```

Note on DB access in WebSocket handler: import `SessionLocal` and `Meeting` model directly. This is acceptable for MVP. Production would use an event bus or background task.

---

## Frontend Changes

### `apps/web/hooks/useWebSocket.ts` / `MeetingRoom.tsx`

Add handlers for new incoming events:

```typescript
case 'host-muted-you':
  // Force mute local audio
  muteLocalAudio()    // from useMediaDevices: set AudioTrack.enabled = false
  setIsMuted(true)
  showToast('The host has muted you')
  break

case 'removed-from-meeting':
  // Disconnect WebSocket, stop media, redirect
  cleanup()
  router.push('/dashboard?removed=1')
  break

case 'all-muted':
  muteLocalAudio()
  setIsMuted(true)
  break

case 'meeting-ended':
  cleanup()
  router.push('/dashboard?ended=1')
  break
```

### `apps/web/components/meeting/ParticipantsSidebar.tsx`

Add host controls UI — only visible when the current user is the host:

```typescript
// For each remote participant:
{isHost && (
  <div className="flex gap-1 ml-auto">
    <button
      title="Mute"
      onClick={() => send({ event: 'mute-participant', targetClientId: participant.clientId })}
    >
      <MicOff size={14} />
    </button>
    <button
      title="Remove"
      className="text-destructive"
      onClick={() => send({ event: 'remove-participant', targetClientId: participant.clientId })}
    >
      <UserX size={14} />
    </button>
  </div>
)}
```

### `apps/web/components/meeting/ControlBar.tsx`

Add "Mute All" and "End Meeting" for host:

```typescript
{isHost && (
  <>
    <ControlButton
      icon={<MicOff />}
      label="Mute All"
      onClick={() => send({ event: 'mute-all' })}
    />
    <ControlButton
      icon={<PhoneOff />}
      label="End Meeting"
      variant="destructive"
      onClick={handleEndMeeting}
    />
  </>
)}
```

`handleEndMeeting`:

1. Send `{ event: 'end-meeting' }` via WebSocket
2. Also call `api.endMeeting(meetingCode)` as backup HTTP call
3. Cleanup media and WebSocket
4. `router.push('/dashboard')`

Non-host participants see only "Leave Meeting":

```typescript
<ControlButton
  icon={<PhoneOff />}
  label="Leave"
  variant="destructive"
  onClick={handleLeave}
/>
```

### `apps/web/app/dashboard/page.tsx`

Show a toast/banner if navigated back with query params:

```typescript
const searchParams = useSearchParams();
if (searchParams.get("removed") === "1")
  showBanner("You were removed from the meeting");
if (searchParams.get("ended") === "1") showBanner("The meeting has ended");
```

---

## Role Detection in Frontend

The current user is the host if:

```typescript
const isHost = meeting.host_user_id === DEFAULT_USER_ID; // 1
```

This is set once when `MeetingRoom` mounts. Pass `isHost` down to `ControlBar` and `ParticipantsSidebar` as a prop.

---

## Confirmation Dialog for Destructive Actions

Before removing a participant or ending a meeting, show a simple confirm dialog:

```typescript
// Use browser's native confirm() for MVP simplicity
const confirmed = window.confirm(
  `Remove ${participant.displayName} from the meeting?`,
);
if (!confirmed) return;
send({ event: "remove-participant", targetClientId: participant.clientId });
```

For end meeting:

```typescript
const confirmed = window.confirm("End the meeting for all participants?");
```

A custom `ZoomDialog` component (shadcn/ui dialog) would be preferred for better UX, but `window.confirm` is acceptable for MVP.

---

## Acceptance Criteria

- Host sees mute icon on each participant tile in the sidebar
- Clicking mute on a participant mutes them; the mute icon updates on the muted user's tile for all participants
- Host sees a "Remove" button; clicking it disconnects that participant and redirects them to dashboard
- "Mute All" button mutes every non-host participant
- "End Meeting" ends the meeting for everyone; all non-host participants are redirected to dashboard
- Non-host users do not see host control buttons
- Muted participant's mute state persists in `ParticipantState` so late joiners see the correct state
- Removing a participant removes their video tile from all other participants' views
