# Zoom Clone

A Zoom-like video conferencing platform built with **Next.js** (frontend) and **FastAPI** (backend), organized as a **Turborepo + pnpm** monorepo.

See [`docs/`](docs/) for the full assignment brief and technical architecture guide.

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

## Monorepo Structure

```
Zoom-Clone/
├── apps/
│   ├── web/          # Next.js frontend  (@zoom-clone/web)
│   └── api/          # FastAPI backend   (@zoom-clone/api)
├── docs/             # Assignment brief + architecture guide
├── docker-compose.yml
├── render.yaml       # Render deploy blueprint
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## Prerequisites

| Tool   | Version | Install                                                                      |
| ------ | ------- | ---------------------------------------------------------------------------- |
| Node   | ≥ 24    | [nodejs.org](https://nodejs.org)                                             |
| pnpm   | ≥ 11    | `npm install -g pnpm`                                                        |
| uv     | ≥ 0.5   | [docs.astral.sh/uv](https://docs.astral.sh/uv/getting-started/installation/) |
| Docker | any     | [docker.com](https://www.docker.com) — optional, for smoke tests             |

---

## Native Dev (recommended for day-to-day)

```bash
# 1. Install all JS dependencies (generates root pnpm-lock.yaml)
pnpm install

# 2. Install Python dependencies
cd apps/api && uv sync && cd ../..

# 3. Copy and edit environment files
cp .env.example .env            # optional root convenience copy
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# 4. Seed the default user (first run only)
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

---

## Docker Dev (smoke testing)

> **Note:** Docker is used for integration smoke tests, not for day-to-day hot-reload development. Use native dev above for active development.

```bash
docker compose up --build
```

Same ports apply: frontend on 3000, backend on 8000.

SQLite data is stored in a named Docker volume (`api_data`) and persists across `docker compose down` unless you also pass `--volumes`.

---

## Environment Variables

| Variable              | App | Default                    | Description                        |
| --------------------- | --- | -------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL` | web | `http://localhost:8000`    | REST API base URL (browser-facing) |
| `NEXT_PUBLIC_WS_URL`  | web | `ws://localhost:8000`      | WebSocket URL (browser-facing)     |
| `DATABASE_URL`        | api | `sqlite:///./data/zoom.db` | SQLAlchemy connection string       |
| `CORS_ORIGINS`        | api | `http://localhost:3000`    | Comma-separated allowed origins    |
| `DEFAULT_USER_ID`     | api | `1`                        | ID of the seeded demo user         |
| `PORT`                | api | `8000`                     | Uvicorn listen port                |

See [`apps/web/.env.example`](apps/web/.env.example) and [`apps/api/.env.example`](apps/api/.env.example) for per-app templates.

---

## Deployment

### Frontend — Vercel

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
   > Use `wss://` (not `ws://`) in production — HTTPS origins require secure WebSockets.

### Backend — Render

1. Connect the repository in [render.com](https://render.com).
2. Render will auto-detect [`render.yaml`](render.yaml) and create the web service.
3. After the first deploy, open the **Shell** tab and run:
   ```bash
   cd apps/api && uv run python seed.py
   ```
4. Set `CORS_ORIGINS` to your Vercel URL (e.g. `https://zoom-clone-abc.vercel.app,http://localhost:3000`).

> **Free-tier limitation:** Render's free web services have an **ephemeral filesystem**. SQLite data is lost on every redeploy or restart. Re-run the seed script after each deploy. For persistent data, upgrade to a Render paid plan with a persistent disk.

> **WebSocket support:** Render free web services support WebSockets, which is required for signaling. The service spins down after inactivity on the free tier — the first request after a cold start may take 30–60 s.

---

## Architecture Decisions & Known Limitations

- **Mesh WebRTC** — Each browser opens a peer connection to every other participant. This works well for up to ~4 participants; larger rooms need an SFU (e.g. LiveKit, mediasoup).
- **In-memory room state** — `ConnectionManager` lives in the FastAPI process. Scaling to multiple workers requires Redis pub/sub.
- **No authentication** — All requests use a hardcoded demo user (id=1). A production build would add JWT or OAuth.
- **SQLite** — Zero-config for local development. Switch `DATABASE_URL` to PostgreSQL for production persistence.
- **No Alembic** — `Base.metadata.create_all` on startup is fine for a demo; real apps need versioned migrations.

---

## Assumptions & Decisions

| Area        | MVP Decision                    | Production Upgrade        |
| ----------- | ------------------------------- | ------------------------- |
| Auth        | Default user hardcoded (id=1)   | JWT / OAuth               |
| Video       | Mesh WebRTC (browser ↔ browser) | SFU (LiveKit / mediasoup) |
| Room state  | In-memory dict                  | Redis pub/sub             |
| Database    | SQLite file                     | PostgreSQL                |
| Migrations  | `create_all` on startup         | Alembic                   |
| Meeting IDs | Random 9-digit code             | Signed, rate-limited      |

---

## Features

- **Instant meetings** — one-click "Start" creates and joins a meeting
- **Scheduled meetings** — schedule future meetings with title, time, and duration
- **Join by code** — join any meeting by entering the 9-digit code
- **Real-time video & audio** — full WebRTC mesh between all participants
- **Screen sharing** — share your screen with a single click
- **Host controls** — mute individual participants, mute all, remove participants, end the meeting
- **Participants sidebar** — live list of who's in the room with media status indicators
- **Toast notifications** — invite link copied, host-muted feedback, meeting-ended alerts
- **Responsive design** — works on mobile (375 px) through desktop (1280 px+)

---

## Development Roadmap

| Phase | Goal                                               |
| ----- | -------------------------------------------------- |
| 1     | ✅ Monorepo scaffold                               |
| 2     | ✅ Backend REST APIs + service layer               |
| 3     | ✅ Dashboard UI + join/schedule pages              |
| 4     | ✅ Meeting room layout + camera/mic preview        |
| 5     | ✅ Full WebSocket signaling protocol               |
| 6     | ✅ WebRTC mesh: video, audio, screen share         |
| 7     | ✅ Host controls: mute, remove, end meeting        |
| 8     | ✅ Polish: responsive design, toasts, error states |
