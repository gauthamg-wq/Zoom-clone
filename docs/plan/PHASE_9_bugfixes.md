# Phase 9 — Post-Launch Bug Fixes

## Overview

Eight bugs were identified after deploying the application to production (Vercel frontend + Render backend). They are ordered from highest to lowest severity. All eight must be resolved before the new features in Phase 10 are added.

---

## Bug 1 — WebRTC race condition: remote participants receive no audio or video

**Severity:** Critical  
**Symptom:** A participant can see their own camera locally but the other person in the meeting cannot see or hear them. This affects every device and browser.

**Root cause:**

Two independent `useEffect` hooks fire concurrently on mount inside `MeetingRoom.tsx`:

1. The WebSocket effect sends `join-room` the moment the WebSocket opens.
2. A separate `init()` effect calls `startMedia()` → `getUserMedia()`, which is async.

When the server responds with `existing-participants`, `handleExistingParticipants` is called immediately, which calls `createPeerConnection`. At that point `localStreamRef.current` is still `null` because `getUserMedia` has not resolved yet. The relevant guard in `useWebRTC.ts`:

```typescript
const stream = localStreamRef.current;
if (stream) {
  stream.getTracks().forEach((track) => pc.addTrack(track, stream));
}
```

Because `stream` is `null`, zero media tracks are added to the peer connection. The SDP offer is sent with no media, the remote peer establishes a data channel but receives nothing.

**Files affected:**
- `apps/web/app/meeting/[meetingCode]/MeetingRoom.tsx`
- `apps/web/hooks/useWebRTC.ts`

**Fix strategy:**

Do not send `join-room` until `localStream` is non-null. Move the `join-room` signal out of the `isConnected` effect and into a new effect that fires only when **both** `isConnected === true` and `localStream !== null`.

```
Before:  WS opens → join-room → existing-participants → createPC (localStream is null)
After:   startMedia() → localStream ready → WS opens → join-room → existing-participants → createPC (localStream ready)
```

As a belt-and-suspenders guard, also add a `useEffect` in `useWebRTC` that watches `localStream`: when it transitions from `null` to a real stream, iterate all existing peer connections and add any missing tracks, then trigger renegotiation.

---

## Bug 2 — No TURN server: WebRTC fails in production behind NAT

**Severity:** Critical  
**Symptom:** WebRTC works locally or on the same network but fails intermittently or completely in production when participants are on different networks (home broadband, mobile data, corporate Wi-Fi).

**Root cause:**

The ICE configuration in `useWebRTC.ts` only includes STUN:

```typescript
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};
```

STUN only resolves the public IP of a peer. It cannot relay traffic. When both peers are behind symmetric NAT (the common case for home routers, mobile carriers, and corporate firewalls), STUN cannot establish a direct path and the connection silently fails. A TURN relay server is required for reliable production WebRTC.

**Files affected:**
- `apps/web/hooks/useWebRTC.ts`

**Fix strategy:**

Add TURN server entries to `ICE_SERVERS`. Use environment variables for credentials so they can be rotated without a code deploy. The Open Relay Project (`openrelay.metered.ca`) provides a publicly usable TURN server suitable for demos and low-traffic production. For higher traffic, switch to a paid service (Metered, Twilio, Xirsys).

```typescript
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: process.env.NEXT_PUBLIC_TURN_URL ?? "turn:openrelay.metered.ca:80",
      username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? "openrelayproject",
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "openrelayproject",
    },
    {
      urls: process.env.NEXT_PUBLIC_TURN_URL_TCP ?? "turn:openrelay.metered.ca:443?transport=tcp",
      username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? "openrelayproject",
      credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "openrelayproject",
    },
  ],
};
```

Add `NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USERNAME`, and `NEXT_PUBLIC_TURN_CREDENTIAL` to `.env.example` and to the Vercel environment variables.

---

## Bug 3 — Host cannot leave without ending the meeting for everyone

**Severity:** High  
**Symptom:** The host's control bar and header both show only "End Meeting". There is no way for the host to leave and let the meeting continue for other participants.

**Root cause:**

Both `ControlBar.tsx` and `MeetingHeader.tsx` use a binary `isHost ? onEnd : onLeave` pattern — the host gets "End Meeting" and non-hosts get "Leave Meeting", with no third path.

**Files affected:**
- `apps/web/components/meeting/ControlBar.tsx`
- `apps/web/components/meeting/MeetingHeader.tsx`

**Fix strategy:**

Replace the binary button with a split control for the host:

- A "Leave Meeting" button that calls `onLeave` (sends `leave-room`; the meeting continues).
- A separate "End for All" button that calls `onEnd` (sends `end-meeting`; terminates the room).

This matches the standard Zoom UX where the host sees a "Leave" dropdown with two options. Non-hosts are unchanged.

---

## Bug 4 — Screen share WebSocket events not handled on the client

**Severity:** High  
**Symptom:** When a participant starts or stops screen sharing, remote participants' tiles do not update to reflect the screen-share state.

**Root cause:**

`signaling.py` correctly broadcasts `screen-share-started` and `screen-share-stopped` to all room members. However, `MeetingRoom.handleWsEvent` does not handle these two event types — they fall through to `default: break`. The `is_screen_sharing` field on remote participant state is never updated, so remote tiles never change their visual state.

**Files affected:**
- `apps/web/app/meeting/[meetingCode]/MeetingRoom.tsx`

**Fix strategy:**

Add two cases to `handleWsEvent`:

```typescript
case "screen-share-started":
  setRemoteParticipants((prev) =>
    prev.map((p) =>
      p.clientId === ev.clientId ? { ...p, is_screen_sharing: true } : p
    )
  );
  break;

case "screen-share-stopped":
  setRemoteParticipants((prev) =>
    prev.map((p) =>
      p.clientId === ev.clientId ? { ...p, is_screen_sharing: false } : p
    )
  );
  break;
```

Also add `screen-share-started` and `screen-share-stopped` to the `WSEvent` union in `types.ts` if they are not already typed (they are present in the type but not handled in the switch).

---

## Bug 5 — "Camera access is required" screen is a dead end with no retry

**Severity:** High  
**Symptom:** The meeting room shows "Camera access required" even after the user grants permissions, or after accidentally dismissing the first prompt. There is no way to retry without refreshing the page. On mobile browsers the initial permission prompt resolves more slowly, increasing how often this is triggered.

**Root cause:**

`useMediaDevices.startMedia()` sets `error` on any `getUserMedia` failure. `MeetingRoom.tsx` replaces the entire video grid with a `PermissionError` component when `error` is non-null. The component has no retry button. There is also no graceful fallback to audio-only or video-only if one device is unavailable.

**Files affected:**
- `apps/web/app/meeting/[meetingCode]/MeetingRoom.tsx`
- `apps/web/hooks/useMediaDevices.ts`

**Fix strategy:**

1. Add a "Try Again" button to the `PermissionError` component that calls `startMedia()` again.
2. On failure, attempt fallbacks in order:
   - Both video and audio (current behaviour).
   - Audio only (`{video: false, audio: true}`) if the camera is denied or unavailable.
   - Video only (`{video: true, audio: false}`) if the microphone is denied.
3. Show a non-blocking warning banner instead of replacing the entire video grid, so the user can still see participants even if their own camera is unavailable.

---

## Bug 6 — `isHost` is hardcoded to user ID 1

**Severity:** Medium  
**Symptom:** The host detection logic — which controls which buttons are shown and which WebSocket events are authorised — depends on comparing `meeting.host_user_id === 1`. This works only in the single-user demo. Any participant who happens to have `user_id === 1` is treated as host regardless of their actual role.

**Root cause:**

```typescript
// MeetingRoom.tsx
const isHost = meeting.host_user_id === 1;
```

`DEFAULT_USER_ID` is hardcoded to `1` in both the frontend and backend. The backend already returns the correct `role` field (`"host"` or `"participant"`) in the `JoinMeetingResponse`, but the frontend ignores it.

**Files affected:**
- `apps/web/app/meeting/[meetingCode]/MeetingRoom.tsx`

**Fix strategy:**

Store the `role` returned from `api.joinMeeting` in state and use it to derive `isHost`:

```typescript
const [myRole, setMyRole] = useState<"host" | "participant">("participant");
const isHost = myRole === "host";

// In init():
const { participant } = await api.joinMeeting(meeting.meeting_code, displayName);
participantIdRef.current = participant.id;
setMyRole(participant.role as "host" | "participant");
```

When navigating via the join form (which passes `?participantId=`), the role is already known and can be passed as a search param to avoid a second API call.

---

## Bug 7 — Local video tile always shows the host crown

**Severity:** Low  
**Symptom:** Every user sees a gold crown on their own tile regardless of whether they are the host.

**Root cause:**

`VideoGrid.tsx` passes `isHost` hardcoded as a boolean prop to the local tile without using the actual `isHost` value from `MeetingRoom`:

```tsx
<VideoTile
  stream={localStream}
  displayName={localName}
  isMuted={isMuted}
  isVideoOn={isScreenSharing ? true : isVideoOn}
  isLocal
  isHost   {/* ← always true; prop shorthand without a value */}
  size={tileSize}
/>
```

**Files affected:**
- `apps/web/components/meeting/VideoGrid.tsx`

**Fix strategy:**

Pass `isHost` as an explicit prop to `VideoGrid` and forward it to the local `VideoTile`:

```tsx
// VideoGrid.tsx — add isHost to props interface and pass it down
<VideoTile ... isHost={isHost} />
```

---

## Bug 8 — WebSocket URL uses `ws://` instead of `wss://` in production

**Severity:** Medium  
**Symptom:** WebSocket connections fail silently in production. The frontend falls back to `ws://localhost:8000` if `NEXT_PUBLIC_WS_URL` is not set. Even when set, using `ws://` (unencrypted) on an `https://` page is blocked by browser mixed-content policy.

**Root cause:**

```typescript
// lib/constants.ts
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";
```

If `NEXT_PUBLIC_WS_URL` is not configured on Vercel, every WebSocket connection fails immediately, which in turn means `join-room` is never sent, and participants are never visible to each other.

**Files affected:**
- `apps/web/lib/constants.ts`
- `.env.example`
- Vercel environment variable configuration (not a code file)

**Fix strategy:**

Add a dev-time guard that warns if the app is running on `https://` but `WS_URL` is still `ws://`:

```typescript
if (
  typeof window !== "undefined" &&
  window.location.protocol === "https:" &&
  WS_URL.startsWith("ws://")
) {
  console.warn("[Config] WS_URL uses ws:// on an https:// page — connections will be blocked. Set NEXT_PUBLIC_WS_URL=wss://your-backend.");
}
```

Update `.env.example` with the correct production value:

```
NEXT_PUBLIC_WS_URL=wss://your-render-app.onrender.com
```

Document this in README.md as a mandatory environment variable.

---

## Acceptance Criteria

- [ ] Two participants on different networks (not localhost) can both see and hear each other.
- [ ] Screen share state updates correctly on all remote tiles.
- [ ] The host can leave the meeting without ending it for others.
- [ ] A user who accidentally denies camera access sees a retry button and is not permanently blocked from the room.
- [ ] Host crown appears only on the actual host's tile.
- [ ] `isHost` is determined from the `role` field returned by `api.joinMeeting`, not from a hardcoded user ID comparison.
- [ ] The production Vercel deployment connects via `wss://` and the WebSocket handshake succeeds (visible in DevTools → Network → WS tab).
- [ ] No TypeScript compiler errors after all changes (`pnpm --filter @zoom-clone/web build` passes).
