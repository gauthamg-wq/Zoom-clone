# AGENTS.md

AI agent guidance for the Zoom Clone monorepo.

## Repo at a Glance

| Path             | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `apps/web/`      | Next.js 16 frontend (App Router, Tailwind v4, shadcn/ui) |
| `apps/api/`      | FastAPI backend (SQLAlchemy 2, Pydantic v2, WebSockets)  |
| `docs/`          | Architecture guide and assignment brief                  |
| `.cursor/rules/` | Per-file coding conventions                              |

## Running the Project

```bash
# Install all deps
pnpm install

# Dev — all apps via Turborepo
pnpm dev

# Frontend only
pnpm --filter @zoom-clone/web dev

# Backend only
cd apps/api && uv run uvicorn app.main:app --reload
```

## Key Conventions

- **Separation of concerns** — UI in `components/`, logic in `lib/`/`hooks/`, API routes in `routers/`
- **TypeScript** — strict, no `any`, `@/` alias maps to `apps/web/`
- **Python** — 3.12, managed with `uv`, typed FastAPI route handlers
- **Styling** — Tailwind v4 CSS-first, `cn()` utility, CVA for component variants
- **React** — Server Components by default; `'use client'` only when necessary
- **Comments** — explain _why_, never narrate _what_ the code does

## Current State

All 8 phases complete. The app is fully functional.
See `docs/plan/` for the original phase-by-phase implementation plan.
