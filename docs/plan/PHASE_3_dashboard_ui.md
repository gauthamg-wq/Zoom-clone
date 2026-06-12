# Phase 3 — Dashboard UI + Join/Schedule Pages + API Client

## Goal

Build the full Zoom-like dashboard with real API data, a join flow, and a schedule form. Wire up all frontend API calls. Install missing dependencies.

---

## Dependencies to Install

```bash
cd apps/web
pnpm add react-hook-form zod date-fns
```

No additional UI libraries needed — shadcn/ui + Radix is already installed.

---

## Files to Create

### `apps/web/lib/constants.ts`

```typescript
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";
export const DEFAULT_DISPLAY_NAME = "Demo User";
```

### `apps/web/lib/types.ts`

TypeScript interfaces mirroring backend Pydantic schemas:

```typescript
export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Meeting {
  id: number;
  meeting_code: string;
  title: string;
  description: string | null;
  host_user_id: number;
  scheduled_start_time: string | null;
  duration_minutes: number | null;
  status: "scheduled" | "live" | "ended";
  invite_link: string | null;
  created_at: string;
}

export interface Participant {
  id: number;
  meeting_id: number;
  display_name: string;
  user_id: number | null;
  role: "host" | "participant";
  joined_at: string;
  left_at: string | null;
  is_muted: boolean;
  is_video_on: boolean;
}

export interface RecentMeeting {
  id: number;
  meeting_id: number;
  user_id: number;
  joined_at: string;
  meeting: Meeting;
}

export interface JoinMeetingResponse {
  meeting: Meeting;
  participant: Participant;
}
```

### `apps/web/lib/api.ts`

Typed fetch wrapper + all API call functions:

```typescript
// Base fetch wrapper (throws on non-2xx with error message from API)
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T>;

// Meeting API calls
export const api = {
  getUpcomingMeetings: () => apiFetch<Meeting[]>("/meetings/upcoming"),
  getRecentMeetings: () => apiFetch<RecentMeeting[]>("/meetings/recent"),
  getMeeting: (code: string) => apiFetch<Meeting>(`/meetings/${code}`),
  createInstantMeeting: () =>
    apiFetch<Meeting>("/meetings/instant", { method: "POST" }),
  scheduleMeeting: (data: ScheduleMeetingPayload) =>
    apiFetch<Meeting>("/meetings/schedule", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    }),
  joinMeeting: (code: string, display_name: string) =>
    apiFetch<JoinMeetingResponse>(`/meetings/${code}/join`, {
      method: "POST",
      body: JSON.stringify({ display_name }),
      headers: { "Content-Type": "application/json" },
    }),
  endMeeting: (code: string) =>
    apiFetch<Meeting>(`/meetings/${code}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "ended" }),
      headers: { "Content-Type": "application/json" },
    }),
  getParticipants: (code: string) =>
    apiFetch<Participant[]>(`/participants/${code}`),
  leaveParticipant: (code: string, participant_id: number) =>
    apiFetch<{ ok: boolean }>(`/participants/${code}/leave`, {
      method: "POST",
      body: JSON.stringify({ participant_id }),
      headers: { "Content-Type": "application/json" },
    }),
};
```

---

### `apps/web/app/page.tsx`

Replace the design-system showcase with a simple redirect:

```typescript
import { redirect } from "next/navigation";
export default function RootPage() {
  redirect("/dashboard");
}
```

---

### `apps/web/app/dashboard/page.tsx`

Server component — fetches upcoming + recent meetings server-side (or client-side with `'use client'` + `useEffect`).

Use client-side fetch (`'use client'`) for simplicity in MVP since `NEXT_PUBLIC_API_URL` is a browser env var:

```typescript
"use client";
// useEffect to fetch getUpcomingMeetings + getRecentMeetings in parallel
// Show ZoomSkeleton while loading
// Pass data to DashboardContent component
```

---

### `apps/web/components/dashboard/DashboardNavbar.tsx`

Zoom-style top navbar:

- Left: Zoom "Z" logo + wordmark "Zoom"
- Center: search bar (non-functional placeholder, for visual fidelity)
- Right: avatar circle "D" (Demo User), settings icon

```
[Z Zoom]     [🔍 Search]     [⚙ 🔔 D]
```

### `apps/web/components/dashboard/QuickActions.tsx`

Row of 3 action cards exactly matching Zoom's dashboard layout:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  🎥             │  │  ➕             │  │  🗓             │
│  New Meeting    │  │  Join           │  │  Schedule       │
│  [Start ▾]      │  │  [Join]         │  │  [Schedule]     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

- "New Meeting": calls `api.createInstantMeeting()` → then calls `api.joinMeeting(code, "Demo User")` → redirects to `/meeting/{code}?name=Demo+User&participantId={participant.id}`
- "Join": opens the join dialog / navigates to `/join`
- "Schedule": navigates to `/schedule`

### `apps/web/components/dashboard/UpcomingMeetings.tsx`

Section with heading "Upcoming Meetings". Each row shows:

- Meeting title
- `scheduled_start_time` formatted with `date-fns` (`"Today, 2:00 PM"` or `"Tomorrow, 10:00 AM"`)
- Duration
- "Start" button → calls `api.joinMeeting(code, "Demo User")` → redirect to `/meeting/{code}?name=Demo+User&participantId={participant.id}`
- "Copy Invite Link" button → copies `invite_link` to clipboard

Empty state: "No upcoming meetings. Schedule one to get started."

### `apps/web/components/dashboard/RecentMeetings.tsx`

Section with heading "Previous Meetings". Each row shows:

- Meeting title
- `joined_at` relative time: `"Yesterday"`, `"2 days ago"` (using `date-fns/formatDistanceToNow`)
- Duration
- "Start" button (rejoin) → calls `api.joinMeeting(code, "Demo User")` → redirect to `/meeting/{code}?name=Demo+User&participantId={participant.id}`

Empty state: "No recent meetings yet."

---

### `apps/web/app/join/page.tsx` + `apps/web/components/dashboard/JoinMeetingForm.tsx`

Two-step form:

**Step 1** — Enter Meeting ID:

- Input: meeting code (placeholder "123-456-789")
- "Continue" → calls `GET /meetings/{code}`; shows error if 404
- Zod schema: `z.string().min(9).max(11)` (allow dashes or plain digits)

**Step 2** — Enter display name:

- Input: display name (pre-filled "Demo User")
- "Join Now" → calls `POST /meetings/{code}/join` → redirects to `/meeting/{code}?name={name}&participantId={participant.id}`
- The `participant_id` from the join response **must** be passed in the URL so `MeetingRoom.tsx` does not call `POST /join` a second time. Calling it twice creates duplicate Participant records in the database.

### `apps/web/app/schedule/page.tsx` + `apps/web/components/dashboard/ScheduleMeetingForm.tsx`

Form fields (React Hook Form + Zod):

- Title (required, min 1 char)
- Description (optional textarea)
- Date (date input)
- Time (time input)
- Duration (select: 15 / 30 / 45 / 60 / 90 / 120 minutes)

On submit: `POST /meetings/schedule` → show success toast + redirect to `/dashboard`

Zod schema:

```typescript
z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string(), // "YYYY-MM-DD"
  time: z.string(), // "HH:MM"
  duration_minutes: z.coerce.number().min(15),
});
// transform: combine date + time → ISO 8601 scheduled_start_time
```

---

## Files to Edit

### `apps/web/app/layout.tsx`

- Change `title` to `'Zoom Clone'`
- Change `description` to `'Professional video conferencing'`
- Remove missing icon references (`icon-light-32x32.png`, `icon-dark-32x32.png`, `apple-icon.png`); use only `/icon.svg`

### `apps/web/app/globals.css`

Add a toast/notification utility class if not using a library. Use a simple inline approach or the existing `ZoomCard` + CSS animation for a lightweight toast.

---

## Routing Map After Phase 3

| Route             | Component                | Description                              |
| ----------------- | ------------------------ | ---------------------------------------- |
| `/`               | `app/page.tsx`           | Redirects → `/dashboard`                 |
| `/dashboard`      | `app/dashboard/page.tsx` | Main dashboard with meetings             |
| `/join`           | `app/join/page.tsx`      | Two-step join flow                       |
| `/join?code=XXX`  | `app/join/page.tsx`      | Pre-filled meeting code from invite link |
| `/schedule`       | `app/schedule/page.tsx`  | Schedule a new meeting                   |
| `/meeting/[code]` | _(Phase 4)_              | Video meeting room                       |

---

## Dashboard Visual Spec (Zoom-inspired)

```
┌──────────────────────────────────────────────────────────────────┐
│  Z Zoom        [🔍 Search meetings...]          [⚙] [🔔] [D]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │  🎥          │  │  ➕          │  │  🗓          │         │
│   │  New Meeting │  │  Join        │  │  Schedule    │         │
│   │  [Start ▾]   │  │  [Join]      │  │  [Schedule]  │         │
│   └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│   Upcoming Meetings                                              │
│   ┌────────────────────────────────────────────────────────┐    │
│   │  Team Sync         Today, 2:00 PM   30 min  [Start]   │    │
│   │  Design Review     Tomorrow, 10 AM  60 min  [Start]   │    │
│   └────────────────────────────────────────────────────────┘    │
│                                                                  │
│   Previous Meetings                                              │
│   ┌────────────────────────────────────────────────────────┐    │
│   │  Sprint Planning   Yesterday        45 min  [Start]   │    │
│   │  1:1 with Manager  2 days ago       30 min  [Start]   │    │
│   └────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

- `/dashboard` loads and displays upcoming + recent meetings from the API
- Loading states use `ZoomSkeleton` rows
- "New Meeting" creates an instant meeting and redirects to the room URL
- "Join" navigates to join page; entering a valid code proceeds to step 2; invalid code shows error
- "Schedule" submits the form and meeting appears in Upcoming Meetings
- Responsive layout works on mobile (stack cards vertically)
- No TypeScript errors, no `any` types
