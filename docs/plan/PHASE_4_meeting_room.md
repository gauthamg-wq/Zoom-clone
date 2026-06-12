# Phase 4 — Meeting Room Layout + Camera/Mic Preview

## Goal

Build the full meeting room page: video grid, control bar, participant sidebar. Hook up the local camera and microphone using `getUserMedia`. The room renders correctly even before WebSocket/WebRTC is wired (Phase 5-6).

---

## Files to Create

### `apps/web/hooks/useMediaDevices.ts`

Manages local camera + mic stream.

```typescript
"use client";
// State managed: localStream, isMuted, isVideoOn, error
// Returns:
//   localStream: MediaStream | null
//   isMuted: boolean
//   isVideoOn: boolean
//   toggleAudio: () => void
//   toggleVideo: () => void
//   startMedia: () => Promise<void>    // call getUserMedia
//   stopMedia: () => void              // stop all tracks
```

Key implementation notes:

- Call `navigator.mediaDevices.getUserMedia({ video: true, audio: true })`
- `toggleAudio`: flip `AudioTrack.enabled` (does NOT remove track — keeps peer connection alive)
- `toggleVideo`: flip `VideoTrack.enabled`
- Graceful fallback: if camera permission denied, set `error` state and show permission prompt
- Call `stopMedia()` in cleanup on component unmount

---

### `apps/web/app/meeting/[meetingCode]/page.tsx`

This is a **Server Component** that:

1. Validates the meeting code via `GET /meetings/{code}` (server-side fetch from `API_URL` env var — this is the non-`NEXT_PUBLIC_` server-side URL)
2. If 404 → renders a "Meeting not found" page
3. If found → renders `<MeetingRoom>` client component with meeting data as props

```typescript
// Server component — no 'use client'
import MeetingRoom from './MeetingRoom'

export default async function MeetingPage({ params }) {
  const meeting = await fetchMeeting(params.meetingCode)  // server-side fetch
  if (!meeting) return <MeetingNotFound />
  return <MeetingRoom meeting={meeting} />
}
```

Note: `NEXT_PUBLIC_API_URL` works server-side too; keep it simple for MVP.

### `apps/web/app/meeting/[meetingCode]/MeetingRoom.tsx`

Main client component (`'use client'`). Orchestrates all sub-components.

State:

- `displayName: string` — read from URL search param `?name=` or default "Demo User"
- `participantId: number | null` — read from URL search param `?participantId=` first; fall back to calling `POST /meetings/{code}/join` only if absent
- `isSidebarOpen: boolean`
- Media state from `useMediaDevices`
- WebSocket + WebRTC hooks will be wired here in Phase 5-6

Layout:

```
┌──────────────────────────────────────────────────────────────────┐
│  MeetingHeader (code, timer, end/leave)                         │
├─────────────────────────────────────────┬────────────────────────┤
│                                         │                        │
│          VideoGrid                      │  ParticipantsSidebar  │
│   (local video + remote video tiles)    │  (toggle with button) │
│                                         │                        │
├─────────────────────────────────────────┴────────────────────────┤
│  ControlBar (mic, camera, screen share, participants, end)       │
└──────────────────────────────────────────────────────────────────┘
```

On mount:

1. Read `participantId` from URL search param `?participantId=`. If present, skip the join API call — the caller (join page, dashboard) already called it and passed the ID. If absent (e.g. user navigated directly to the URL), call `POST /meetings/{code}/join` with `displayName` → store `participantId`. This prevents duplicate Participant rows when entering via the join page or dashboard "Start" buttons, which all pre-call `/join` and encode the returned `participant_id` in the URL.
2. Call `startMedia()` from `useMediaDevices`
3. Connect WebSocket (Phase 5)

On unmount / "Leave":

1. Call `POST /participants/{code}/leave` with `participant_id`
2. Call `stopMedia()`
3. Disconnect WebSocket
4. `router.push('/dashboard')`

---

### `apps/web/components/meeting/MeetingHeader.tsx`

Top bar of the meeting room:

- Left: meeting code in monospace (click to copy)
- Center: live timer (elapsed time since joined, `HH:MM:SS` — use `setInterval`)
- Right: "Leave" button (destructive outline) for participants, "End Meeting" (destructive solid) for host

Determine host by: `meeting.host_user_id === 1` (default user is always host in MVP)

### `apps/web/components/meeting/VideoTile.tsx`

Single video tile — reused for local and remote participants:

Props:

```typescript
interface VideoTileProps {
  stream: MediaStream | null;
  displayName: string;
  isMuted: boolean;
  isVideoOn: boolean;
  isLocal?: boolean; // shows "You" label
  isHost?: boolean; // shows host crown icon
  size?: "large" | "normal" | "small";
}
```

Rendering:

- `<video ref={videoRef} autoPlay muted={isLocal} playsInline />` — `muted` only on local to avoid echo
- If `isVideoOn = false` → show avatar circle (initial letter) instead of video
- Dark background (`bg-gray-900`)
- Display name badge at bottom-left
- Mute icon at top-right if `isMuted`
- Host crown icon if `isHost`

```typescript
useEffect(() => {
  if (videoRef.current && stream) {
    videoRef.current.srcObject = stream;
  }
}, [stream]);
```

### `apps/web/components/meeting/VideoGrid.tsx`

Responsive grid of `VideoTile` components.

Layout strategy based on participant count:

- 1 participant (self only): 1 large centered tile
- 2 participants: 2-column grid
- 3 participants: 2 columns (1 large + 2 below)
- 4+ participants: 2×N grid

In Phase 4 (before WebRTC), only the local stream tile is shown. Remote tiles are added in Phase 6.

### `apps/web/components/meeting/ControlBar.tsx`

Bottom control bar. Background: dark (`bg-gray-900`), white icons.

Controls (left to right):

1. **Mic toggle** — `Mic` / `MicOff` lucide icon; red background when muted
2. **Camera toggle** — `Video` / `VideoOff` lucide icon; red background when off
3. **Screen Share** — `Monitor` icon (Phase 6 wires this up; Phase 4: button present, non-functional)
4. **Participants** — `Users` icon; toggles `ParticipantsSidebar`
5. **End / Leave** — red "Leave Meeting" button (or "End Meeting" for host)

Each control is a rounded icon button. Tooltip on hover (title attribute is enough for MVP).

```
[🎤] [📷] [🖥] [👥]     [Leave Meeting]
```

### `apps/web/components/meeting/ParticipantsSidebar.tsx`

Slide-in sidebar from the right:

- Heading: "Participants (N)"
- List of participants — each showing: avatar circle (initial), display name, host badge, mute/video icons
- In Phase 4: fetches `GET /participants/{code}` on mount to populate the list
- Host controls (mute/remove buttons) added in Phase 7

---

## Files to Edit

### `apps/web/app/globals.css`

Add meeting room specific styles:

```css
/* Dark background for video grid area */
.meeting-bg {
  background-color: #1c1c1c;
}

/* Prevent body scroll in meeting room */
.meeting-root {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
```

---

## URL Convention

The meeting room is accessed via:

- `/meeting/{meetingCode}?name=Demo+User&participantId=42`

Both params are always set when navigating programmatically:

- "New Meeting" button → calls `POST /join` → `router.push('/meeting/{code}?name=Demo+User&participantId={id}')`
- "Start" (upcoming/recent) → calls `POST /join` → `router.push('/meeting/{code}?name=Demo+User&participantId={id}')`
- Join page step 2 → calls `POST /join` → `router.push('/meeting/{code}?name={enteredName}&participantId={id}')`

`MeetingRoom.tsx` reads both with `useSearchParams()`. If `participantId` is missing (user typed the URL manually), `MeetingRoom.tsx` calls `POST /join` itself.

---

## Pre-Phase-5 Behaviour (Standalone)

In Phase 4, with no WebSocket yet:

- Only local video is shown (1 tile)
- No remote participants
- Control bar buttons for mic/camera work (toggle track enabled)
- "Leave Meeting" calls the leave endpoint and redirects

This is a valid standalone state — the room is fully functional for a single user.

---

## Acceptance Criteria

- Navigating to `/meeting/{valid-code}?name=Demo+User` shows the room
- Local camera appears in the video tile within 2 seconds of page load
- Clicking mic button toggles mute (video track enabled = false, icon changes)
- Clicking camera button hides/shows local video (shows avatar fallback when off)
- Clicking "Leave Meeting" hits the leave API and redirects to dashboard
- Meeting room fills the full viewport (no scrollbar)
- Navigating to `/meeting/{invalid-code}` shows a clear error page
- Screen is not white/blank while camera permission is loading
