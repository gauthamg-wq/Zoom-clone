.DEFAULT_GOAL := help

# ─── Paths & tools ───────────────────────────────────────────────────────────
PNPM        := pnpm
API_DIR     := apps/api
WEB_DIR     := apps/web
WEB_FILTER  := @zoom-clone/web
API_FILTER  := @zoom-clone/api
API_PORT    ?= 8000
WEB_PORT    ?= 3000

# ─── Help ────────────────────────────────────────────────────────────────────
.PHONY: help
help: ## Show available commands
	@printf "\nUsage: make <target>\n\n"
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@printf "\n"

# ─── Setup ───────────────────────────────────────────────────────────────────
.PHONY: install install-js install-api setup env seed
install: install-js install-api ## Install JS (pnpm) and Python (uv) dependencies

install-js: ## Install monorepo JavaScript dependencies
	$(PNPM) install

install-api: ## Install API Python dependencies
	cd $(API_DIR) && uv sync

setup: install env seed ## First-time setup: install deps, copy env files, seed DB

env: ## Copy .env.example files (skips if destination already exists)
	@cp -n .env.example .env 2>/dev/null || true
	@cp -n $(WEB_DIR)/.env.example $(WEB_DIR)/.env.local 2>/dev/null || true
	@cp -n $(API_DIR)/.env.example $(API_DIR)/.env 2>/dev/null || true
	@echo "Environment files ready (existing files were not overwritten)."

seed: ## Seed the default demo user in the API database
	cd $(API_DIR) && uv run python seed.py

# ─── Development ─────────────────────────────────────────────────────────────
.PHONY: dev dev-web dev-api
dev: ## Start all apps in dev mode (Turbo)
	$(PNPM) dev

dev-web: ## Start the Next.js frontend only
	$(PNPM) --filter $(WEB_FILTER) dev

dev-api: ## Start the FastAPI backend only (hot reload)
	cd $(API_DIR) && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port $(API_PORT)

# ─── Build & run ─────────────────────────────────────────────────────────────
.PHONY: build build-web start start-web start-api
build: ## Build all apps (Turbo)
	$(PNPM) build

build-web: ## Build the Next.js frontend only
	$(PNPM) turbo build --filter=$(WEB_FILTER)

start: ## Build and start all apps in production mode (Turbo)
	$(PNPM) turbo start

start-web: build-web ## Start the Next.js frontend in production mode
	$(PNPM) --filter $(WEB_FILTER) start

start-api: ## Start the FastAPI backend in production mode
	cd $(API_DIR) && uv run uvicorn app.main:app --host 0.0.0.0 --port $(API_PORT)

# ─── Quality ─────────────────────────────────────────────────────────────────
.PHONY: lint lint-web typecheck ci check
lint: ## Lint all apps (Turbo)
	$(PNPM) lint

lint-web: ## Lint the Next.js frontend (ESLint)
	$(PNPM) --filter $(WEB_FILTER) lint

typecheck: ## Type-check the Next.js frontend (tsc --noEmit)
	$(PNPM) --filter $(WEB_FILTER) exec tsc --noEmit

ci: lint build ## Run lint and build (CI pipeline)
check: ci ## Alias for ci

# ─── Docker ──────────────────────────────────────────────────────────────────
.PHONY: docker-up docker-up-detach docker-down docker-down-volumes docker-build docker-logs
docker-up: ## Build and start all services with Docker Compose
	docker compose up --build

docker-up-detach: ## Build and start all services in the background
	docker compose up --build -d

docker-down: ## Stop Docker Compose services
	docker compose down

docker-down-volumes: ## Stop services and remove persisted volumes (SQLite data)
	docker compose down --volumes

docker-build: ## Build Docker images without starting containers
	docker compose build

docker-logs: ## Follow Docker Compose logs
	docker compose logs -f

# ─── Deploy ──────────────────────────────────────────────────────────────────
.PHONY: deploy deploy-web deploy-api
deploy: deploy-web deploy-api ## Deploy frontend (Vercel) and backend (Render)

deploy-web: build-web ## Deploy frontend to Vercel (requires Vercel CLI)
	cd $(WEB_DIR) && vercel --prod

deploy-api: ## Print Render backend deploy instructions
	@echo "Backend deploys via Render using render.yaml."
	@echo "  1. Connect the repo at https://render.com"
	@echo "  2. Set CORS_ORIGINS to your Vercel URL after the first deploy"
	@echo "  3. Run 'make seed' in the Render shell after each deploy (free tier)"

# ─── Cleanup ─────────────────────────────────────────────────────────────────
.PHONY: clean clean-all
clean: ## Remove build artifacts and caches
	rm -rf $(WEB_DIR)/.next .turbo
	find $(API_DIR) -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

clean-all: clean ## Remove dependencies (node_modules, Python .venv)
	rm -rf node_modules $(WEB_DIR)/node_modules $(API_DIR)/.venv
