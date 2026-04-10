# GC_TeamWork 项目规范

## Architecture

- **Frontend:** React 19 + Vite 7 + TypeScript 5.9 + Tailwind CSS v4 (npm)
- **Backend:** Python 3.11 + FastAPI + Pydantic v2
- **State:** Zustand (frontend) | Supabase (database, optional)
- **LLM:** DeepSeek/OpenAI-compatible API via httpx
- **Design:** Fila design language (see `frontend/src/index.css` for tokens)

## Project Structure

- `frontend/` — React SPA (port 5173, proxies /api to 8000)
- `src/` — Python FastAPI backend
- `src/agents/` — 11 domain-specific AI agents
- `src/api/routes/` — REST API endpoints
- `tests/` — Python pytest tests
- `supabase/` — Database migrations and seed data

## Code Style

- **Frontend:** ESLint v9 flat config + Prettier (see `frontend/eslint.config.js`, `frontend/.prettierrc`)
- **Backend:** Ruff (see `pyproject.toml [tool.ruff]`)
- **Commits:** Conventional Commits `<type>(<scope>): <subject>`
- **Scopes:** frontend, backend, agents, infra, docs, workflow, db

## Commands

```bash
# Frontend
cd frontend && npm run dev        # Dev server
cd frontend && npm run build      # Type check + build
cd frontend && npm run lint       # ESLint
cd frontend && npm run format     # Prettier format
cd frontend && npm test           # Vitest

# Backend
uvicorn src.main:app --reload     # Dev server (port 8000)
pytest tests/ -v                  # Run tests
ruff check src/                   # Lint
ruff format src/                  # Format
```

## Key Conventions

- Widget-based architecture: Atomic → Business → View (see `frontend/src/widgets/`)
- All API calls go through `frontend/src/services/api.ts`
- Zustand stores in `frontend/src/stores/`
- Agent system: DispatchAgent routes to specialized agents via intent classification
- Fila design tokens defined in CSS custom properties (see tailwind @theme)
