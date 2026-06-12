# Phase 8 — Polish, Responsive Design, Error States, Seed Data & README

## Goal

Make the app production-ready in appearance: responsive on all screens, meaningful error states, a rich seed dataset, and updated documentation. No new features — only quality improvements.

---

## 1. Responsive Design

### Dashboard (`apps/web/app/dashboard/page.tsx` + components)

The quick action cards should stack vertically on mobile:

```css
/* Tailwind: grid-cols-1 sm:grid-cols-3 */
```

Navbar collapses: search bar hidden on mobile (`hidden sm:block`), hamburger menu or simplified avatar-only row.

Upcoming/Recent meetings: table-like rows become stacked cards on mobile.

### Meeting Room (`apps/web/app/meeting/[meetingCode]/`)

- On mobile (< 640px): single-column video tiles, control bar uses smaller icons
- Control bar scrolls horizontally if needed (`overflow-x-auto`)
- Participants sidebar becomes a bottom sheet on mobile (CSS: `fixed bottom-0 w-full` vs `fixed right-0 h-full`)

### Join / Schedule pages

Already single-column forms — should be fine. Ensure max-width + horizontal padding on mobile:

```css
/* max-w-lg mx-auto px-4 */
```

---

## 2. Error States & Loading

### Global error boundary

Create `apps/web/app/error.tsx`:

```typescript
'use client'
export default function GlobalError({ error, reset }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <ZoomButton onClick={reset}>Try again</ZoomButton>
      </div>
    </div>
  )
}
```

### Not-found page

Create `apps/web/app/not-found.tsx`:

```typescript
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <ZoomButton asChild><a href="/dashboard">Go to Dashboard</a></ZoomButton>
      </div>
    </div>
  )
}
```

### Meeting not found page

`apps/web/app/meeting/[meetingCode]/page.tsx` — if `fetchMeeting` returns null:

```typescript
// Render a dedicated "Meeting not found" component with a "Back to Dashboard" button
```

### Camera permission denied

In `useMediaDevices.ts`, catch `NotAllowedError`:

```typescript
} catch (err) {
  if (err instanceof DOMException && err.name === 'NotAllowedError') {
    setError('camera_denied')
  } else {
    setError('media_error')
  }
}
```

In `MeetingRoom.tsx`, show a banner above the video grid:

```
⚠ Camera or microphone access denied.
  You can still join with audio/video disabled.
  [Open Browser Settings]
```

### API error states on dashboard

When `getUpcomingMeetings` or `getRecentMeetings` fails:

```typescript
// Show "Could not load meetings. Check your connection." with a retry button
// Use ZoomSkeleton while loading, error card after failure
```

---

## 3. Toast Notifications

A lightweight toast system is needed for:

- "Invite link copied!" (when copy button clicked)
- "Meeting scheduled successfully"
- "You have been muted by the host"
- "The meeting has ended"

Options (in order of preference):

1. Install `sonner` (lightweight, React 19 compatible): `pnpm add sonner`
2. Or build a minimal custom toast with CSS transitions using a `ToastProvider` context

Add `<Toaster />` to `apps/web/app/layout.tsx`.

---

## 4. Seed Data Update (`apps/api/seed.py`)

Enrich with more realistic data:

```python
# 3 upcoming meetings with varied times
Meeting(title="Team Sync", status="scheduled",
        scheduled_start_time=now + timedelta(hours=2), duration_minutes=30)
Meeting(title="Design Review", status="scheduled",
        scheduled_start_time=now + timedelta(days=1, hours=9), duration_minutes=60)
Meeting(title="Engineering All-Hands", status="scheduled",
        scheduled_start_time=now + timedelta(days=3), duration_minutes=90)

# 3 ended meetings with recent_meeting rows
Meeting(title="Sprint Planning", status="ended",
        scheduled_start_time=now - timedelta(days=1), duration_minutes=45)
Meeting(title="1:1 with Manager", status="ended",
        scheduled_start_time=now - timedelta(days=2), duration_minutes=30)
Meeting(title="Client Demo", status="ended",
        scheduled_start_time=now - timedelta(days=4), duration_minutes=60)
```

All meeting codes are auto-generated (via service function, called from seed).

---

## 5. Layout & Metadata

### `apps/web/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: "Zoom Clone",
  description: "Professional video conferencing — Zoom Clone",
  icons: {
    icon: "/icon.svg", // Only icon.svg exists; remove missing PNG refs
  },
};
```

---

## 6. AGENTS.md Update

Update the "Current State" section:

```markdown
## Current State

All 8 phases complete. The app is fully functional.
See docs/plan/ for the original phase-by-phase implementation plan.
```

---

## 7. README.md Update

Add or update sections:

- **Features** — list all implemented features
- **Tech Stack** — full list with versions
- **Setup** — native + Docker instructions (already exists, verify still accurate)
- **Environment Variables** — document all vars with defaults
- **Architecture Decisions** — brief notes on mesh WebRTC, in-memory room state, SQLite, no auth
- **Known Limitations / Production Improvements** — brief list from architecture guide §15

---

## 8. Code Quality Checklist

Run through each file modified across all phases:

- No `any` TypeScript types
- No bare Python `except:` without specific exception type
- No comments that narrate what the code does
- All `async` functions have `await` where needed
- Python: use `datetime.now(timezone.utc)` throughout — `datetime.utcnow()` is deprecated in Python 3.12 and should not be used in new code
- Pydantic models: all response models use `model_config = ConfigDict(from_attributes=True)` where reading from ORM
- `useEffect` cleanup functions present for all WebSocket/media/interval effects
- `videoRef.current.srcObject = null` on `VideoTile` unmount

---

## 9. Missing Assets

Create placeholder PNG icons to avoid 404s in browser console:

- `apps/web/public/icon-light-32x32.png` — either generate a simple 32×32 blue "Z" PNG or remove from layout (removing is simpler)
- `apps/web/public/apple-icon.png` — same approach

Simplest fix: remove references from `layout.tsx` and use only `icon.svg` (already done in layout edit above).

---

## Acceptance Criteria

- The app looks correct on 375px (iPhone), 768px (iPad), 1280px (desktop)
- Navigating to a bad URL shows the 404 page instead of a blank/error screen
- Camera permission denied shows a graceful message, not a crash
- Dashboard shows a proper error card if the API is unreachable
- `GET /meetings/upcoming` returns 3 meetings after running seed
- `GET /meetings/recent` returns 3 recent meeting entries
- No browser console errors on fresh page load
- No TypeScript compiler errors (`pnpm --filter @zoom-clone/web build` succeeds)
- README accurately describes setup and architecture
