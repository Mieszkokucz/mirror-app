# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Mirror — a personal reflection system. Backend: FastAPI + PostgreSQL + Anthropic LLM. Frontend: Next.js + Tailwind CSS (in `frontend/`).

## Commands

```bash
# Run the backend dev server
uvicorn main:app --reload

# Run the frontend dev server
cd frontend && npm run dev

# Install backend dependencies
pip install -r requirements.txt

# Run tests
pytest

# Seed built-in system prompts and default user
python seed.py
```

`.env` requires: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `TEST_DATABASE_URL`

## Architecture

**Request flow:** Router → Service → LLM Gateway → Anthropic API

- `main.py` — FastAPI app entry point, mounts routers
- `database.py` — SQLAlchemy engine, `Base`, `get_db()` dependency (reads `DATABASE_URL` from `.env`)
- `services/llm_gateway.py` — Anthropic API wrapper (`send_to_anthropic()`)
- `services/conversation.py` — Chat orchestration: session creation, message persistence, system prompt loading from DB, LLM call
- `models/system_prompts.py` — `SystemPrompt` model (built-in + user-custom prompts)
- `routers/system_prompts.py` — CRUD for system prompts (built-in prompts cannot be deleted)
- `seed.py` — Seeds built-in system prompts (morning, midday, evening reflection) and default user

**Chat flow:** `POST /chat/` → `handle_chat()` creates a `Session` if `session_id` is null, resolves system prompt from DB by `prompt_id` (UUID), saves user message, loads full session history, sends to Anthropic, saves assistant response. `prompt_id=null` means free chat (empty system prompt).

**Key details:**
- System prompts selected via `prompt_id` field (UUID) — loaded from `system_prompt` table. `null` = free chat.
- Built-in prompts have `user_id=NULL`; user-custom prompts have `user_id` set.
- Default LLM model: `claude-haiku-4-5-20251001`
- All UUIDs are server-generated (`gen_random_uuid()`)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat/` | Send message, get LLM response (`session_id=null` → new session, `prompt_id=null` → free chat) |
| GET | `/chat/sessions?user_id=` | List user's sessions |
| GET | `/chat/sessions/{id}/messages` | Messages in a session |
| GET | `/reflections/?user_id=` | List reflections for user |
| GET | `/reflections/{id}` | Single reflection |
| POST | `/reflections/` | Create reflection |
| PATCH | `/reflections/{id}` | Partial update |
| DELETE | `/reflections/{id}` | Returns 204 |
| POST | `/system-prompts/` | Create system prompt |
| GET | `/system-prompts/?user_id=` | List user's + built-in prompts |
| GET | `/system-prompts/{id}` | Single prompt |
| PATCH | `/system-prompts/{id}` | Partial update |
| DELETE | `/system-prompts/{id}` | Delete (403 for built-ins) |

## Conventions

- English for all code and documentation
- Comments only where logic isn't obvious
- Agents (`.claude/agents/`) have scoped directory permissions — respect boundaries
