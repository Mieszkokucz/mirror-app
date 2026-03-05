# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Mirror — a personal reflection system. Backend: FastAPI + PostgreSQL + Anthropic LLM. Frontend: Next.js + Tailwind CSS (planned, in `frontend/`).

## Commands

```bash
# Run the dev server
uvicorn main:app --reload

# Install dependencies
pip install -r requirements.txt
```

No test framework, linter, or formatter is configured yet.

## Architecture

**Request flow:** Router → Service → LLM Gateway → Anthropic API

- `main.py` — FastAPI app entry point, mounts routers
- `database.py` — SQLAlchemy engine, `Base`, `get_db()` dependency (reads `DATABASE_URL` from `.env`)
- `services/llm_gateway.py` — Anthropic API wrapper (`send_to_anthropic()`)
- `services/conversation.py` — Chat orchestration: session creation, message persistence, prompt loading, LLM call
- `services/prompts/` — System prompt `.txt` files loaded by key (currently: `morning_reflection`)

**Chat flow:** `POST /chat/` → `handle_chat()` creates a `Session` if `session_id` is null, saves user message to DB, loads full session history, sends to Anthropic with optional system prompt selected by `prompt` key, saves assistant response.

**Key details:**
- Hardcoded `user_id` (`b2769e58-...`) in conversation service — pre-auth placeholder
- System prompts selected via `prompt` field in `ChatRequest` (Pydantic `Literal` type)
- Default LLM model: `claude-haiku-4-5-20251001`
- All UUIDs are server-generated (`gen_random_uuid()`)
- `.env` requires: `DATABASE_URL`, `ANTHROPIC_API_KEY`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat/` | Send message, get LLM response (`session_id=null` → new session) |
| GET | `/reflections/?user_id=` | List reflections for user |
| GET | `/reflections/{id}` | Single reflection |
| POST | `/reflections/` | Create reflection |
| PATCH | `/reflections/{id}` | Partial update |
| DELETE | `/reflections/{id}` | Returns 204 |

## Conventions

- English for all code and documentation
- Comments only where logic isn't obvious
- Agents (`.claude/agents/`) have scoped directory permissions — respect boundaries
