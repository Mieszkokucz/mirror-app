# Mirror

A personal reflection system powered by AI. Mirror guides you through structured daily journaling (morning, midday, evening) using Claude as a conversational partner — helping you reflect deeper, track patterns over time, and build self-awareness.

## Features

- **Guided daily reflections** — three built-in structured prompts (morning, midday, evening) that adapt to your answers
- **AI-powered journaling** — Claude asks follow-up questions based on your responses, then synthesizes a final reflection
- **Persistent chat sessions** — full conversation history, model selection (Haiku / Sonnet), and custom system prompts
- **File library** — upload reference documents and attach them as context in any chat session
- **Context injection** — attach saved reflections or library files directly into a conversation
- **Reflection export** — download any date range as a plain-text file
- **Custom prompts** — create and manage your own system prompts alongside the built-ins

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | FastAPI, SQLAlchemy 2, Alembic, PostgreSQL 16 |
| AI | Anthropic API (Claude Haiku / Sonnet) |
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Infrastructure | Docker, Docker Compose |

## Quick Start (Docker)

The only prerequisite is an Anthropic API key.

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd app

# 2. Set your API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env

# 3. Start everything
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

Docker Compose handles migrations, seeding, and all service dependencies automatically.

## Manual Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 16

### Backend

```bash
pip install -r requirements.txt

# Create .env with:
# DATABASE_URL=postgresql://user:pass@localhost:5432/reflection_db
# TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/reflection_db_test
# ANTHROPIC_API_KEY=sk-ant-...

alembic upgrade head
python seed.py
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend

# Create .env.local with:
# NEXT_PUBLIC_USER_ID=<uuid-from-seed>

npm install
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `TEST_DATABASE_URL` | Tests only | Separate DB for test suite |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `NEXT_PUBLIC_USER_ID` | Yes (frontend) | UUID of the active user (single-user setup) |

## API Reference

### Chat

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat/` | Send a message; creates session if `session_id` is null; `prompt_id=null` means free chat |
| `GET` | `/chat/sessions` | List sessions for a user (`?user_id=`) |
| `GET` | `/chat/sessions/{id}/messages` | Full message history for a session |

### Reflections

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/reflections/` | Create a reflection |
| `GET` | `/reflections/` | List reflections (`?user_id=`) |
| `GET` | `/reflections/{id}` | Get a single reflection |
| `PATCH` | `/reflections/{id}` | Partial update |
| `DELETE` | `/reflections/{id}` | Delete (returns 204) |
| `GET` | `/reflections/export` | Export as TXT (`?user_id=&date_from=&date_to=`) |

### System Prompts

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/system-prompts/` | Create a prompt |
| `GET` | `/system-prompts/` | List user + built-in prompts (`?user_id=`) |
| `GET` | `/system-prompts/{id}` | Get a single prompt |
| `PATCH` | `/system-prompts/{id}` | Update |
| `DELETE` | `/system-prompts/{id}` | Delete (403 for built-ins) |

### Files

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/files/library` | Upload a file to the library (`?user_id=`) |
| `GET` | `/files/library` | List library files (`?user_id=`) |
| `DELETE` | `/files/library/{id}` | Delete a file (returns 204) |

## Project Structure

```
app/
├── main.py                  # FastAPI app, router registration
├── database.py              # SQLAlchemy engine and session
├── seed.py                  # Built-in prompts + default user
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── models/                  # SQLAlchemy ORM models
│   ├── chat.py              # Session, Message, MessageContext
│   ├── reflections.py       # User, DailyReflection, PeriodicReflection
│   ├── system_prompts.py    # SystemPrompt
│   └── files.py             # File, MessageAttachment
├── routers/                 # Route handlers (thin layer)
├── schemas/                 # Pydantic request/response schemas
├── services/
│   ├── conversation.py      # Chat orchestration and LLM calls
│   ├── files.py             # File upload and storage
│   └── llm_gateway.py       # Anthropic API wrapper
├── alembic/                 # Database migrations
├── tests/                   # pytest test suite
└── frontend/                # Next.js application
    └── src/
        ├── app/             # Pages and layout
        ├── components/      # React UI components
        └── lib/             # API client, constants, utilities
```

## Running Tests

```bash
pytest
```

Tests require `TEST_DATABASE_URL` to point to a separate PostgreSQL database.

## Architecture

```
Frontend (Next.js)
      │  HTTP / FormData
      ▼
Router  ──►  Service  ──►  LLM Gateway  ──►  Anthropic API
              │
              ▼
         PostgreSQL
```

**Chat flow:** `POST /chat/` receives a message with optional `session_id`, `prompt_id`, context reflection IDs, context file IDs, and inline file uploads. `services/conversation.py` creates a session if needed, loads the system prompt from the database, injects any attached reflections and file contents into the system prompt, saves the user message, sends the full conversation history to the Anthropic API, and persists the assistant response.

**File storage:** Library files are saved to `uploads/{user_id}/{uuid}.ext` with SHA-256 deduplication. Text files are embedded directly into the system prompt when attached to a chat.

**Built-in prompts:** Three Polish-language reflection guides (`morning`, `midday`, `evening`) are seeded into the database with `user_id = NULL`. They cannot be deleted via the API.
