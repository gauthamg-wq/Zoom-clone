---
name: Zoom UI Dashboard
overview: "Redesign the dashboard to match Zoom Workplace's visual style: dimmed light-grey page background, Zoom SVG logo in the navbar, and a Zoom-style action area with prominent time/date header and icon-button-with-label layout replacing the current card grid."
todos:
  - id: background
    content: Update --background CSS token in globals.css to light grey
    status: completed
  - id: navbar-logo
    content: Swap Z-box + Zoom text with next/image Zoom SVG logo in DashboardNavbar.tsx
    status: completed
  - id: quick-actions
    content: "Redesign QuickActions.tsx: add live time/date header, replace card grid with horizontal icon+label buttons in Zoom style"
    status: completed
isProject: false
---

# Zoom UI Dashboard Redesign

## What Changes

The goal is to match the Zoom Workplace home screen from the screenshots: a subtly dimmed background, the real Zoom logo, a centered time/date display, and three compact icon+label action buttons (not cards).

---

## 1. Page Background — `globals.css`

Change `--background` from near-white to Zoom's light grey, keeping `--card` as pure white so the navbar and cards remain bright:

```css
/* before */
--background: oklch(0.995 0 0);

/* after — matches Zoom's #f5f5f5 approx */
--background: oklch(0.965 0 0);
```

---

## 2. Navbar Logo — `DashboardNavbar.tsx`

Replace the hardcoded "Z" box + "Zoom" text with the real SVG via `next/image`:

```tsx
// before
<div className="w-8 h-8 rounded-lg bg-primary ...">Z</div>
<span className="text-xl font-bold">Zoom</span>

// after
import Image from "next/image";
<Image src="/Zoom_logo.svg" width={90} height={20} alt="Zoom" priority />
```

---

## 3. Quick Actions — `QuickActions.tsx`

This is the largest change. Replace the 3-column card grid with:

- A **time/date header** (live clock using `useState` + `useEffect`, formatted as "3:10 PM" / "Saturday, June 13")
- A **horizontal row of 3 icon+label buttons** matching Zoom's layout exactly

**New layout structure:**

```
┌──────────────────────────────────────┐
│          3:10 PM                     │  ← large, font-light
│      Saturday, June 13               │  ← small muted text
│                                      │
│  [🎥]      [＋]      [📅]           │
│  New        Join    Schedule          │
│ meeting↓                             │
└──────────────────────────────────────┘
```

**Button styles (to match Zoom):**

- "New meeting": `w-14 h-14 rounded-2xl bg-[#f26a22]` (Zoom orange) with `VideoOff` icon + small chevron dropdown affordance on the label
- "Join": `w-14 h-14 rounded-2xl bg-[#0b5cff]` (Zoom blue from SVG) with `Plus` icon
- "Schedule": `w-14 h-14 rounded-2xl bg-[#0b5cff]` with a `Calendar` icon showing today's date number

Remove the `ZoomCard` / `ZoomCardContent` imports entirely from this component.

---

## Files Touched

- [`apps/web/app/globals.css`](apps/web/app/globals.css) — background color token
- [`apps/web/components/dashboard/DashboardNavbar.tsx`](apps/web/components/dashboard/DashboardNavbar.tsx) — logo swap
- [`apps/web/components/dashboard/QuickActions.tsx`](apps/web/components/dashboard/QuickActions.tsx) — full redesign (time header + icon buttons)

No changes to `page.tsx`, `UpcomingMeetings.tsx`, or `RecentMeetings.tsx` — those sections are below the fold and remain intact.
