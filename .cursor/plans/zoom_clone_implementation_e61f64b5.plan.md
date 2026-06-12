---
name: Zoom Clone Implementation
overview: Complete the Zoom Clone from Phase 1 scaffold to a fully functional video conferencing app across 7 sequential phases, covering REST APIs, dashboard UI, meeting room, WebSocket signaling, WebRTC mesh, host controls, and final polish.
todos:
  - id: phase-2
    content: "Phase 2: Implement all backend REST endpoints + service layer + seed data"
    status: completed
  - id: phase-3
    content: "Phase 3: Build dashboard UI, join/schedule pages, API client"
    status: completed
  - id: phase-4
    content: "Phase 4: Meeting room layout, camera/mic preview with useMediaDevices"
    status: completed
  - id: phase-5
    content: "Phase 5: Full WebSocket signaling event protocol (backend + frontend hook)"
    status: pending
  - id: phase-6
    content: "Phase 6: WebRTC mesh — offer/answer/ICE, remote video streams, screen share"
    status: pending
  - id: phase-7
    content: "Phase 7: Host controls — mute/remove/end meeting"
    status: pending
  - id: phase-8
    content: "Phase 8: Polish — responsive design, error states, seed data, README update"
    status: pending
isProject: false
---

# Zoom Clone — Full Implementation Plan

## Current State (Phase 1 Complete)

- Monorepo scaffold: Turborepo + pnpm, Next.js 16 + FastAPI
- Design system UI components (`ZoomButton`, `ZoomCard`, `ZoomSkeleton`)
- DB models + Pydantic schemas defined but wired to zero routes
- WebSocket relay stub (broadcasts JSON, no event logic)
- `app/page.tsx` is a design showcase, not a real dashboard
- No hooks, no `lib/api.ts`, no frontend pages

## Phases Overview

```mermaid
flowchart LR
  P2[Phase 2\nBackend APIs] --> P3[Phase 3\nDashboard UI]
  P3 --> P4[Phase 4\nMeeting Room]
  P4 --> P5[Phase 5\nWebSocket Signaling]
  P5 --> P6[Phase 6\nWebRTC Mesh]
  P6 --> P7[Phase 7\nHost Controls]
  P7 --> P8[Phase 8\nPolish & Deploy]
```

Each phase has its own detailed plan file in `docs/plan/`. This document is the index.

## Phase Files

- [`docs/plan/PHASE_2_backend_apis.md`](docs/plan/PHASE_2_backend_apis.md)
- [`docs/plan/PHASE_3_dashboard_ui.md`](docs/plan/PHASE_3_dashboard_ui.md)
- [`docs/plan/PHASE_4_meeting_room.md`](docs/plan/PHASE_4_meeting_room.md)
- [`docs/plan/PHASE_5_websocket_signaling.md`](docs/plan/PHASE_5_websocket_signaling.md)
- [`docs/plan/PHASE_6_webrtc_mesh.md`](docs/plan/PHASE_6_webrtc_mesh.md)
- [`docs/plan/PHASE_7_host_controls.md`](docs/plan/PHASE_7_host_controls.md)
- [`docs/plan/PHASE_8_polish.md`](docs/plan/PHASE_8_polish.md)

## Quick-reference: files touched per phase

| Phase | Backend files                                                                                                  | Frontend files                                                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 2     | `schemas.py`, `services/meeting_service.py` (new), `routers/meetings.py`, `routers/participants.py`, `seed.py` | —                                                                                                                |
| 3     | —                                                                                                              | `lib/types.ts`, `lib/api.ts`, `lib/constants.ts`, `app/page.tsx`, `app/dashboard/`, `app/join/`, `app/schedule/` |
| 4     | —                                                                                                              | `app/meeting/[meetingCode]/`, `components/meeting/`, `hooks/useMediaDevices.ts`                                  |
| 5     | `websocket/manager.py`, `websocket/signaling.py`                                                               | `hooks/useWebSocket.ts`, wire room page                                                                          |
| 6     | —                                                                                                              | `hooks/useWebRTC.ts`, video grid with remote streams                                                             |
| 7     | signaling.py host auth                                                                                         | host UI, end-meeting flow                                                                                        |
| 8     | `seed.py` (richer data)                                                                                        | layout.tsx metadata, error states, README                                                                        |
