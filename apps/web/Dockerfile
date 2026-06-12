# Build context must be the repo root so pnpm workspace files are available.
# docker-compose.yml sets: context: .  dockerfile: apps/web/Dockerfile

# ---- base ----
FROM node:24-alpine AS base
WORKDIR /workspace
RUN npm install -g pnpm@11.0.9

# ---- deps ----
FROM base AS deps
# Copy only the files needed to resolve the workspace dependency graph
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# ---- dev (used by docker compose for smoke tests, no hot-reload) ----
FROM deps AS dev
COPY apps/web apps/web
EXPOSE 3000
CMD ["pnpm", "--filter", "@zoom-clone/web", "dev"]

# ---- prod (optional; Vercel handles production frontend deployment) ----
FROM deps AS builder
COPY apps/web apps/web
RUN pnpm --filter @zoom-clone/web build

FROM node:24-alpine AS prod
WORKDIR /workspace
RUN npm install -g pnpm@11.0.9
COPY --from=builder /workspace/node_modules ./node_modules
COPY --from=builder /workspace/apps/web/.next apps/web/.next
COPY --from=builder /workspace/apps/web/public apps/web/public
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
EXPOSE 3000
CMD ["pnpm", "--filter", "@zoom-clone/web", "start"]
