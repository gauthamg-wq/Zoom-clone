# Zoom Clone

A Zoom-like video conferencing platform built with **Next.js** (frontend) and **FastAPI** (backend), organized as a **Turborepo + pnpm** monorepo.

See [`docs/Scaler_SDE_Fullstack_Assignment_-_Zoom_Clone.docx.md`](docs/Scaler_SDE_Fullstack_Assignment_-_Zoom_Clone.docx.md) for the assignment brief and [`docs/plan/`](docs/plan/) for the phase-by-phase implementation plan.

---

## Tech Stack

| Layer    | Technology                                              |
| -------- | ------------------------------------------------------- |
| Frontend | Next.js · React · TypeScript · Tailwind CSS · shadcn/ui |
| Backend  | FastAPI · Python 3.12 · uv                              |
| Database | SQLite (MVP) → PostgreSQL (production)                  |
| Realtime | FastAPI WebSockets (signaling) · WebRTC (media)         |
| Monorepo | Turborepo · pnpm workspaces                             |
| Deploy   | Vercel (frontend) · Render (backend)                    |

---

## Assignment Compliance (Must-Have Features)

| #   | Requirement                                                                                                                                | Status         | Notes                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Landing Dashboard** — Zoom-like UI, navbar with profile/settings placeholders, New / Join / Schedule buttons, Upcoming + Recent meetings | ✅ Implemented | Navbar, quick actions, and both meeting lists are wired to the API. Search bar and settings/notifications are visual placeholders only. Recent section is labeled "Previous Meetings". |
| 2   | **Instant Meeting** — unique ID, shareable invite link, redirect to meeting room                                                           | ✅ Implemented | `POST /meetings/instant` generates a 9-digit code and stores `invite_link`. Redirects to pre-join lobby → room. Copy invite link from lobby, in-meeting header, or participants panel. |
| 3   | **Join Meeting** — by ID or invite link, display name, validate existence                                                                  | ✅ Implemented | Two-step join form (accepts raw codes and full URLs), invite-link route, validation on `/join?code=`. Single join point in pre-join lobby with backend idempotency.                    |
| 4   | **Schedule Meetings** — title/description, date/time, duration, auto link, DB storage, upcoming list                                       | ✅ Implemented | Full form at `/schedule` with past-date validation. Shown on dashboard with copy-link, Start, and Zoom-style window-based visibility.                                                  |

**Also required by the brief (non-feature):**

| Requirement                     | Status                                           |
| ------------------------------- | ------------------------------------------------ |
| No login — default user assumed | ✅ `DEFAULT_USER_ID=1`, seeded demo user         |
| Sample data seeded              | ✅ `apps/api/seed.py` (also runs on API startup) |
| Custom database schema          | ✅ See [Database Schema](#database-schema)       |
| README with setup + assumptions | ✅ This file                                     |

**Good-to-have (deferred):** responsive design polish, user authentication, host controls — some of these are already built beyond the assignment scope; see [Beyond Assignment](#beyond-assignment-scope).

---

## Features

### Core (assignment must-haves)

- **Dashboard** — Zoom-like home with New / Join / Schedule actions, Upcoming and Previous meeting lists
- **Instant meetings** — one-click start, unique 9-digit code, shareable invite link
- **Scheduled meetings** — title, description, date/time, duration; past-date validation on frontend and backend
- **Join flow** — meeting ID or full invite URL, display name, pre-join lobby, meeting existence validation
- **Copy invite link** — pre-join lobby, in-meeting header (Invite), participants panel, upcoming list, schedule success screen

### Dashboard meeting lifecycle (Zoom-aligned)

| State                                              | Upcoming            | Previous    |
| -------------------------------------------------- | ------------------- | ----------- |
| Scheduled, start time in the future                | ✅                  | ❌          |
| Scheduled, start passed but within duration window | ✅ "Ready to start" | ❌          |
| Scheduled, window passed, never joined             | ❌                  | ✅ "Missed" |
| Joined and ended                                   | ❌                  | ✅ "Ended"  |
| Joined and still live                              | ❌                  | ✅ "Rejoin" |

**Upcoming** shows scheduled meetings until `start + duration` ends (not just start time). **Previous** combines join history with missed scheduled meetings the host never started.

### Beyond assignment scope

- Pre-join lobby with camera/mic preview
- Real-time video & audio via WebRTC mesh
- Screen sharing
- Host controls (mute individual, mute all, remove, end meeting)
- Participants sidebar with live media status
- In-meeting chat
- Post-leave page with rejoin option
- Toast notifications (Sonner)

---

## Bug Fixes & Improvements

All identified must-have bugs have been resolved:

| Area                         | Fix                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Duplicate participants**   | Single join point (PreJoinLobby); backend returns existing active participant instead of creating duplicates |
| **Ended meetings**           | Dedicated "Meeting has ended" screen; Previous list shows "Ended" badge (no rejoin button)                   |
| **`/join?code=` validation** | Meeting existence checked on load with loading state                                                         |
| **Invite URL parsing**       | Join form accepts raw codes, hyphenated codes, and full `https://…/meeting/{code}` URLs                      |
| **Silent API errors**        | Toast notifications on failed instant start, join, and schedule                                              |
| **Schedule validation**      | Past dates rejected on frontend (Zod) and backend (400)                                                      |
| **Datetime handling**        | UTC-naive normalization for SQLite upcoming/previous queries                                                 |
| **Meeting visibility gap**   | Zoom-aligned window-based Upcoming/Previous lists (see above)                                                |
| **`FRONTEND_URL`**           | Documented in `.env.example` and `render.yaml` for production invite links                                   |

---

## Monorepo Structure

```
Zoom-Clone/
├── apps/
│   ├── web/          # Next.js frontend  (@zoom-clone/web)
│   └── api/          # FastAPI backend   (@zoom-clone/api)
├── docs/             # Assignment brief + architecture guide + implementation plan
├── docker-compose.yml
├── render.yaml       # Render deploy blueprint
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## Database Schema

Designed for the assignment requirements with room to grow.

```
users
  id, name, email, avatar_url, created_at

meetings
  id, meeting_code (unique 9-digit), title, description,
  host_user_id → users.id, scheduled_start_time, duration_minutes,
  status (scheduled | live | ended), invite_link, created_at

participants
  id, meeting_id → meetings.id, display_name, user_id → users.id,
  role (host | participant), joined_at, left_at, is_muted, is_video_on

recent_meetings
  id, meeting_id → meetings.id, user_id → users.id, joined_at
```

**Relationships:** A `Meeting` belongs to one `User` (host). `Participant` records are created on join (idempotent for active sessions). `RecentMeeting` tracks per-user join history; the Previous list also surfaces missed scheduled meetings via API logic.

**Meeting window:** `scheduled_start_time + duration_minutes` (default 30 min). Used to decide Upcoming vs Previous, matching Zoom's behavior.

**Models:** [`apps/api/app/models.py`](apps/api/app/models.py)  
**Service layer:** [`apps/api/services/meeting_service.py`](apps/api/services/meeting_service.py)

---

## Prerequisites

| Tool   | Version | Install                                                                      |
| ------ | ------- | ---------------------------------------------------------------------------- |
| Node   | ≥ 24    | [nodejs.org](https://nodejs.org)                                             |
| pnpm   | ≥ 11    | `npm install -g pnpm`                                                        |
| uv     | ≥ 0.5   | [docs.astral.sh/uv](https://docs.astral.sh/uv/getting-started/installation/) |
| Docker | any     | [docker.com](https://www.docker.com) — optional, for smoke tests             |

---

## Setup

```bash
# 1. Install all JS dependencies
pnpm install

# 2. Install Python dependencies
cd apps/api && uv sync && cd ../..

# 3. Copy and edit environment files
cp .env.example .env            # optional root convenience copy
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 4. Seed the default user and sample meetings (first run only)
cd apps/api && uv run python seed.py && cd ../..

# 5. Start both apps in parallel via Turbo
pnpm dev
```

| App      | URL                          |
| -------- | ---------------------------- |
| Frontend | http://localhost:3000        |
| Backend  | http://localhost:8000        |
| API docs | http://localhost:8000/docs   |
| Health   | http://localhost:8000/health |

> The API also runs `seed()` automatically on startup. Re-running `seed.py` manually is safe and idempotent.

---

## Docker Dev (smoke testing)

> Docker is used for integration smoke tests, not for day-to-day hot-reload development.

```bash
docker compose up --build
```

Same ports apply: frontend on 3000, backend on 8000.

SQLite data is stored in a named Docker volume (`api_data`) and persists across `docker compose down` unless you also pass `--volumes`.

---

## Environment Variables

| Variable              | App | Default                    | Description                         |
| --------------------- | --- | -------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_API_URL` | web | `http://localhost:8000`    | REST API base URL (browser-facing)  |
| `NEXT_PUBLIC_WS_URL`  | web | `ws://localhost:8000`      | WebSocket URL (browser-facing)      |
| `DATABASE_URL`        | api | `sqlite:///./data/zoom.db` | SQLAlchemy connection string        |
| `CORS_ORIGINS`        | api | `http://localhost:3000`    | Comma-separated allowed origins     |
| `DEFAULT_USER_ID`     | api | `1`                        | ID of the seeded demo user          |
| `FRONTEND_URL`        | api | `http://localhost:3000`    | Base URL for generated invite links |
| `PORT`                | api | `8000`                     | Uvicorn listen port                 |

See [`apps/web/.env.example`](apps/web/.env.example) and [`apps/api/.env.example`](apps/api/.env.example) for per-app templates.

---

## Deployment

### Frontend — Vercel

Production frontend: [zoom-clone-web-brown.vercel.app](https://zoom-clone-web-brown.vercel.app/)

1. Import the repository in [vercel.com](https://vercel.com).
2. Set **Root Directory** to `apps/web`.
3. Override the commands:
   - **Install Command:** `cd ../.. && pnpm install`
   - **Build Command:** `cd ../.. && pnpm turbo build --filter=@zoom-clone/web`
4. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.onrender.com
   NEXT_PUBLIC_WS_URL=wss://your-api.onrender.com
   ```

### Backend — Render

1. Connect the repository in [render.com](https://render.com).
2. Render will auto-detect [`render.yaml`](render.yaml) and create the web service.
3. In the Render dashboard → your **zoom-clone-api** service → **Environment**, add:

   | Key            | Value                                                           |
   | -------------- | --------------------------------------------------------------- |
   | `CORS_ORIGINS` | `https://zoom-clone-web-brown.vercel.app,http://localhost:3000` |
   | `FRONTEND_URL` | `https://zoom-clone-web-brown.vercel.app`                       |

   > No trailing slashes on either value.

4. After the first deploy (or any redeploy on the free tier), open the **Shell** tab and run:
   ```bash
   cd apps/api && uv run python seed.py
   ```

> **Invite links:** Meetings created before `FRONTEND_URL` was set may still have `localhost` links in the DB. New meetings after redeploy use the correct Vercel URL. Re-seed to reset sample data.

> **Free-tier limitation:** Render's free web services have an **ephemeral filesystem**. SQLite data is lost on every redeploy or restart. Re-run the seed script after each deploy.

> **WebSocket support:** Render free web services support WebSockets. The service spins down after inactivity — the first request after a cold start may take 30–60 s.

---

## Assumptions & Decisions

| Area                     | Decision                                                                                    | Rationale                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Authentication**       | No login; hardcoded demo user (`id=1`)                                                      | Assignment explicitly says "assume a default user is logged in"                                         |
| **Meeting IDs**          | Random 9-digit numeric codes                                                                | Matches Zoom's familiar format; collision retry loop in `generate_meeting_code()`                       |
| **Invite links**         | `{FRONTEND_URL}/meeting/{code}` stored in DB; client falls back to `window.location.origin` | Shareable URL for direct navigation; copy available in lobby, header, participants panel, and dashboard |
| **Join flow**            | Pre-join lobby is the single `POST /join` call; upstream pages only redirect with name      | Prevents duplicate participant rows; backend idempotency returns existing active session                |
| **Instant vs scheduled** | Instant → `status=live`; scheduled → `status=scheduled`, flips to `live` on first join      | Clear lifecycle; scheduled meetings stay startable until host ends them                                 |
| **Upcoming meetings**    | `status=scheduled` AND `start + duration > now`                                             | Zoom-aligned: hosts can start late within the scheduled window                                          |
| **Previous meetings**    | Join history + missed scheduled (window passed, never joined)                               | Zoom-aligned: expired never-started meetings remain visible as "Missed"                                 |
| **Video transport**      | Mesh WebRTC (browser ↔ browser)                                                             | Simplest P2P approach for a demo; no media server needed                                                |
| **Signaling**            | FastAPI WebSockets relay                                                                    | SDP/ICE exchange and room events (mute, remove, chat)                                                   |
| **Room state**           | In-memory `ConnectionManager` in the API process                                            | Fine for single-worker demo; Redis needed for horizontal scale                                          |
| **Database**             | SQLite with `create_all` on startup                                                         | Zero-config local dev; PostgreSQL + Alembic for production                                              |
| **UI framework**         | Tailwind v4 + shadcn/ui components                                                          | Rapid Zoom-like styling with accessible primitives                                                      |

---

## Implementation Plan

Development followed an 8-phase plan (all complete), plus post-launch phases for bug fixes and extra features.

| Phase | Goal                                               | Status |
| ----- | -------------------------------------------------- | ------ |
| 1     | Monorepo scaffold                                  | ✅     |
| 2     | Backend REST APIs + service layer + seed data      | ✅     |
| 3     | Dashboard UI + join/schedule pages                 | ✅     |
| 4     | Meeting room layout + camera/mic preview           | ✅     |
| 5     | Full WebSocket signaling protocol                  | ✅     |
| 6     | WebRTC mesh: video, audio, screen share            | ✅     |
| 7     | Host controls: mute, remove, end meeting           | ✅     |
| 8     | Polish: responsive design, toasts, error states    | ✅     |
| 9     | Post-launch bug fixes (WebRTC race, TURN, wss://)  | ✅     |
| 10    | Pre-join lobby, chat, rejoin-after-leave           | ✅     |
| 11    | Bug fixes: join flow, invite links, ended meetings | ✅     |
| 12    | Zoom-aligned dashboard meeting lifecycle           | ✅     |

Full phase docs: [`docs/plan/INDEX.md`](docs/plan/INDEX.md)

---

## Future Improvements

### Good-to-have (assignment bonus — deferred)

- Responsive design polish across all breakpoints
- User authentication (login/signup)
- Host controls refinement (already partially built)

### Production upgrades

| Area                 | MVP                     | Production                                      |
| -------------------- | ----------------------- | ----------------------------------------------- |
| Auth                 | Default user hardcoded  | JWT / OAuth                                     |
| Video                | Mesh WebRTC             | SFU (LiveKit / mediasoup)                       |
| Room state           | In-memory dict          | Redis pub/sub                                   |
| Database             | SQLite file             | PostgreSQL                                      |
| Migrations           | `create_all` on startup | Alembic                                         |
| Meeting IDs          | Random 9-digit          | Signed, rate-limited                            |
| TURN server          | Optional env var        | Required for restrictive NATs                   |
| Auto-end meetings    | Manual host end only    | Auto-end when duration expires                  |
| Invite link backfill | Manual re-seed          | Migration script for stale `invite_link` values |

---

## Architecture Decisions & Known Limitations

- **Mesh WebRTC** — Each browser opens a peer connection to every other participant. Works well for up to ~4 participants; larger rooms need an SFU.
- **In-memory room state** — `ConnectionManager` lives in the FastAPI process. Scaling to multiple workers requires Redis pub/sub.
- **No authentication** — All requests use the seeded demo user. A production build would add JWT or OAuth.
- **SQLite** — Zero-config for local development. Switch `DATABASE_URL` to PostgreSQL for production persistence.
- **No Alembic** — `Base.metadata.create_all` on startup is fine for a demo; real apps need versioned migrations.
