# ---- base ----
FROM python:3.12-slim AS base
WORKDIR /app

# Install uv from the official image — avoids pip and stays cache-efficient
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml .
RUN mkdir -p data

# ---- dev (used by docker compose for smoke tests) ----
FROM base AS dev
RUN uv sync
COPY . .
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]

# ---- prod (used by Render and production deploys) ----
FROM base AS prod
RUN uv sync --no-dev
COPY . .
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
