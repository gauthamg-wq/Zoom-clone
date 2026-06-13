# Zoom Clone — Implementation Plan Index

Phases 1–8 are complete and deployed. Phases 9–10 cover post-launch bug fixes and new features identified after production deployment.

## Phase Files

| #   | File                                                               | What gets built                                                                                                         |
| --- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 2   | [PHASE_2_backend_apis.md](./PHASE_2_backend_apis.md)               | All REST endpoints, service layer, seed data                                                                            |
| 3   | [PHASE_3_dashboard_ui.md](./PHASE_3_dashboard_ui.md)               | Dashboard, Join, Schedule pages, API client                                                                             |
| 4   | [PHASE_4_meeting_room.md](./PHASE_4_meeting_room.md)               | Meeting room layout, camera/mic preview                                                                                 |
| 5   | [PHASE_5_websocket_signaling.md](./PHASE_5_websocket_signaling.md) | Full WebSocket event protocol                                                                                           |
| 6   | [PHASE_6_webrtc_mesh.md](./PHASE_6_webrtc_mesh.md)                 | WebRTC peer connections, video/audio streams, screen share                                                              |
| 7   | [PHASE_7_host_controls.md](./PHASE_7_host_controls.md)             | Mute/remove participants, end meeting                                                                                   |
| 8   | [PHASE_8_polish.md](./PHASE_8_polish.md)                           | Responsive design, error states, rich seed data, README                                                                 |
| 9   | [PHASE_9_bugfixes.md](./PHASE_9_bugfixes.md)                       | Post-launch bug fixes: WebRTC race condition, TURN server, leave/end, screen share, camera retry, isHost, crown, wss:// |
| 10  | [PHASE_10_features.md](./PHASE_10_features.md)                     | New features: in-meeting chat, pre-join lobby, rejoin after leaving                                                     |

## Architecture at a Glance

```
HTTP  → CRUD (meetings, participants, schedule, join)
WS    → Realtime events + WebRTC signaling relay
WebRTC→ Actual audio/video/screen sharing (P2P mesh)
```

## Key Files Per Phase

### Phase 2 — Backend

- `apps/api/services/meeting_service.py` ← NEW service layer
- `apps/api/routers/meetings.py` ← 7 endpoints
- `apps/api/routers/participants.py` ← 2 endpoints
- `apps/api/app/schemas.py` ← extended schemas
- `apps/api/seed.py` ← richer sample data

### Phase 3 — Frontend Foundation

- `apps/web/lib/api.ts` ← typed API client
- `apps/web/lib/types.ts` ← TypeScript interfaces
- `apps/web/lib/constants.ts` ← env-based constants
- `apps/web/app/dashboard/page.tsx` ← main dashboard
- `apps/web/app/join/page.tsx` ← two-step join flow
- `apps/web/app/schedule/page.tsx` ← schedule form
- `apps/web/components/dashboard/` ← navbar, quick actions, meeting lists

### Phase 4 — Meeting Room

- `apps/web/app/meeting/[meetingCode]/page.tsx`
- `apps/web/app/meeting/[meetingCode]/MeetingRoom.tsx`
- `apps/web/hooks/useMediaDevices.ts`
- `apps/web/components/meeting/` ← VideoTile, VideoGrid, ControlBar, ParticipantsSidebar, MeetingHeader

### Phase 5 — WebSocket

- `apps/api/websocket/manager.py` ← stores participant state
- `apps/api/websocket/signaling.py` ← full event dispatch
- `apps/web/hooks/useWebSocket.ts` ← WS hook
- Wire into `MeetingRoom.tsx`

### Phase 6 — WebRTC

- `apps/web/hooks/useWebRTC.ts` ← mesh peer connections
- Update `VideoGrid.tsx` for remote streams
- Wire screen share in `ControlBar.tsx`

### Phase 7 — Host Controls

- `apps/api/websocket/signaling.py` ← host auth + mute/remove/end
- `apps/web/components/meeting/ParticipantsSidebar.tsx` ← host buttons
- `apps/web/components/meeting/ControlBar.tsx` ← mute-all, end meeting

### Phase 8 — Polish

- `apps/web/app/error.tsx`, `not-found.tsx`
- Responsive CSS in all pages
- Toast system (`sonner`)
- `apps/web/app/layout.tsx` ← metadata fix
- `apps/api/seed.py` ← 3 upcoming + 3 recent meetings
- `README.md` update

### Phase 9 — Bug Fixes

- `apps/web/hooks/useWebRTC.ts` ← TURN server + stream-ready guard
- `apps/web/app/meeting/[meetingCode]/MeetingRoom.tsx` ← race condition fix, screen share events, isHost from role, camera retry
- `apps/web/components/meeting/ControlBar.tsx` ← host leave vs end split
- `apps/web/components/meeting/MeetingHeader.tsx` ← host leave vs end split
- `apps/web/components/meeting/VideoGrid.tsx` ← fix local tile crown
- `apps/web/lib/constants.ts` ← wss:// guard
- `.env.example` ← document TURN and WS vars

### Phase 10 — New Features

- `apps/api/websocket/signaling.py` ← chat-message event
- `apps/web/lib/types.ts` ← ChatMessage, extended WS unions
- `apps/web/components/meeting/ChatSidebar.tsx` ← NEW
- `apps/web/components/meeting/PreJoinLobby.tsx` ← NEW
- `apps/web/app/meeting/[meetingCode]/MeetingPageClient.tsx` ← NEW
- `apps/web/app/meeting/[meetingCode]/page.tsx` ← delegate to MeetingPageClient
- `apps/web/app/meeting/[meetingCode]/MeetingRoom.tsx` ← existingStream prop, chat state
- `apps/web/app/meeting/[meetingCode]/left/page.tsx` ← NEW post-leave page
- `apps/web/components/meeting/ControlBar.tsx` ← chat toggle + unread badge
- `apps/web/app/dashboard/page.tsx` ← Rejoin button for live meetings
