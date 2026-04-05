# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This workspace contains the **A2A Personal Agent Platform** – an Agent-to-Agent system built on SecondMe, with integrated memory, preference learning, and matching capabilities. The platform features a comprehensive moral-life system (钱包/功德、修身、训练等) and a modern Next.js frontend. Locally installed **SecondMe Skills** enable development and user interaction with the SecondMe platform.

The workspace has three primary components:

- **A2A Personal Agent Backend** (`src/`, `tsconfig.server.json`) – TypeScript project implementing the personal agent engine, A2A protocol, memory system, preference engine, matching algorithms, moral-life system, and an MCP server.
- **Next.js Frontend** (`app/`, `tsconfig.json`) – React-based web interface built with Next.js 14, featuring pages for wallet, training, profile, topics, quotes, town, roundtable, wasteland, and credit.
- **SecondMe Skills** (`.agents/skills/`) – locally installed Claude Code skills for SecondMe integration (development and end‑user use). The source repository is not present; skills are installed via `npx skills add`.

## Development Commands

### Installation & Build
```bash
# Install dependencies
npm install

# Build both backend (to dist/) and frontend (to .next/)
npm run build

# Build backend only (TypeScript → dist/)
npm run build:server

# Build frontend only (Next.js)
npm run build:web

# Type checking (no emit)
npx tsc --noEmit
```

### Running
```bash
# Start Next.js development server (frontend)
npm run dev

# Start MCP server in development mode (backend)
npm run dev:mcp

# Start production frontend (requires prior build)
npm start

# Start production MCP server
npm run start:mcp:prod

# Run CLI entry point (personal agent engine)
npx ts-node src/cli.ts
```

### Linting & Testing
```bash
# Lint frontend code
npm run lint

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Documentation (Sphinx)
```bash
# Build HTML documentation
make html

# Clean build
make clean
```
Documentation source is in `doc/`. Requires Python environment with Sphinx dependencies (see `README.md`).

## Architecture

### Full‑Stack Overview
- **Backend**: TypeScript modules compiled with `tsconfig.server.json` (CommonJS, output to `dist/`). Includes A2A protocol, agent engine, memory, preference, matching, moral-life system, transport, discovery, and MCP server.
- **Frontend**: Next.js 14 with React, Tailwind CSS, and App Router (`app/`). Pages include wallet (功德系统), training (修身), profile, topics, quotes, town (道场), roundtable (圆桌), wasteland (荒原), and credit.
- **MCP Server**: Standalone Model Context Protocol server (`src/mcp/`) that can be run via `dev:mcp` or deployed via Docker. Provides backend services to frontend and external clients.

### Core Backend Modules

1. **API Integration** (`src/api/`)
   - `secondme/` – OAuth2 authentication, Profile, Key Memory, Plaza, Discover
   - `zhihu/` – Zhihu API integration (circles, billboard, search)
   - `base.ts` – Base API client with common functionality

2. **A2A Protocol** (`src/protocol/a2a/`)
   - `message.ts` – standardized Agent communication message format
   - `registry.ts` – Agent registration and discovery
   - `router.ts` – message routing

3. **Agent Core** (`src/agent/core/`)
   - `engine.ts` – `PersonalAgentEngine` orchestrates agent lifecycle
   - `lifecycle.ts` – agent state management (initializing, ready, stopped)
   - `scheduler.ts` – task scheduling with priority queue
   - `events.ts` – event bus for internal communication

4. **Memory System** (`src/memory/`)
   - `short-term.ts` – session context management with TTL
   - `long-term.ts` – integration with SecondMe Key Memory (persistent storage)
   - `retrieval.ts` – semantic search and recall

5. **Preference Engine** (`src/preference/`)
   - `tracker.ts` – user behavior tracking
   - `patterns.ts` – pattern recognition
   - `builder.ts` – user profile vector construction
   - `engine.ts` – preference learning and inference

6. **Matching Engine** (`src/matching/`)
   - `similarity.ts` – cosine similarity, weighted calculations
   - `weighted.ts` – multi‑dimensional weighted matching
   - `retrieval.ts` – Top‑K retrieval
   - `engine.ts` – matching orchestration
   - `history.ts` – match record storage

7. **Moral-Life System** (`src/moral-life/`)
   - `wallet.ts` – merit points (功德) management, spending, donation, level upgrades
   - `training.ts` – cultivation training system
   - `roundtable.ts` – roundtable discussions
   - `companion.ts` – companion system
   - `daoist-town.ts` – Daoist town interactions
   - `wasteland.ts` – wasteland challenges
   - `credit.ts` – credit system
   - `types.ts` – shared types and interfaces

8. **Utilities** (`src/utils/`)
   - `errors.ts` – centralized error handling with AppError classes
   - `retry.ts` – exponential backoff retry mechanism
   - `cache.ts` – TimedCache for API response caching
   - `logger.ts` – structured logging with Pino
   - `storage/` – cloud storage adapters (Vercel KV, Postgres)

9. **Schemas** (`src/schemas/`)
   - `mcp.ts` – Zod validation schemas for MCP requests
   - `moral-life.ts` – validation schemas for moral-life operations

10. **Transport & Discovery** (`src/transport/`, `src/discovery/`)
    - WebSocket connection management
    - Agent registration and discovery services
    - Health checking

11. **DAO Data Layer** (`src/dao/`) – sample data and loading utilities for 道家 content.

### Entry Points
- `src/cli.ts` – command‑line entry, creates `PersonalAgentEngine`, handles authentication, and starts the agent.
- `src/index.ts` – library exports of core modules for external use.
- `src/mcp/server.ts` – MCP server entry point.
- `app/api/mcp/route.ts` – Next.js API route that proxies to the MCP server.

### Configuration
- `src/config.ts` – API endpoints and constants (`SECONDME_API_BASE`, `ZHIHU_API_BASE`, etc.).
- `.secondme/state.json` – project‑specific configuration (OAuth client IDs, selected modules).
- `.env.example` – environment variables template (copy to `.env.local` for development).
- Credentials are stored in `~/.openclaw/.credentials` (user tokens) and should never be committed.

## Testing

The project uses Jest with the following test suites:

| Suite | Tests | Coverage |
|-------|-------|----------|
| errors.test.ts | 15 | AppError classes, error handling |
| events.test.ts | 8 | EventBus functionality |
| scheduler.test.ts | 6 | TaskScheduler with priority queue |
| mcp.test.ts | 19 | MCP server request handling |
| short-term.test.ts | 8 | ShortTermMemory TTL management |

**Total: 56 tests passing**

Run tests with:
```bash
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage report
```

## Docker Deployment

The MCP server can be run via Docker Compose:

```bash
# Build and start the MCP service
docker-compose up --build

# Run in background
docker-compose up -d
```

The `Dockerfile` builds the backend (`npm run build:server`) and copies the `dist/` folder; the frontend is not included in the container. The service listens on `MCP_PORT` (default 3000).

## Skills Development

### Skill Format
Each skill is a Markdown file (`SKILL.md`) with a YAML header that declares:
- `name` – the skill's identifier (e.g., `secondme`)
- `description` – when Claude should invoke the skill
- `user‑invocable: true` if the skill can be triggered by a slash command (e.g., `/secondme`)

The body contains detailed instructions for Claude, including API endpoints, authentication flows, user prompts, and error handling.

### Available Skills (`.agents/skills/`)
- `secondme/` – unified OpenClaw skill for end‑user interaction (login, profile, Plaza, Discover, Key Memory, Activity, third‑party skill management)
- `secondme‑init/` – project initialization and module selection
- `secondme‑prd/` – product requirement definition via conversation
- `secondme‑nextjs/` – generates a full‑stack Next.js project based on config and PRD
- `secondme‑reference/` – opens the SecondMe API technical reference
- `secondme‑dev‑assistant/` – turns existing projects into MCP integrations
- `frontend‑design/` – front‑end design skill
- `skill‑creator/` – creates new skills

### Using Skills
```bash
# Full development workflow
/secondme

# Step‑by‑step
/secondme‑init          # configure project
/secondme‑prd           # define requirements
/secondme‑nextjs        # generate Next.js project
/secondme‑reference     # open API docs
```

### Skill Updates
- The `.agents/skills/` directory is a local installation; the source repository is not present in this workspace.
- To refresh skills, re‑add them via `npx skills add Mindverse/Second‑Me‑Skills` (or a local path if the source repo is available).
- After editing a `SKILL.md` file, you may need to re‑add the skill for changes to take effect.

## Important Notes

- **Credentials**: Never commit `.secondme/` or `~/.openclaw/.credentials`; they contain OAuth tokens and secrets.
- **Environment Variables**: Copy `.env.example` to `.env.local` and fill in required values (`SECONDME_CLIENT_ID`, `SECONDME_CLIENT_SECRET`, `ZHIHU_API_KEY`, etc.).
- **Skill updates**: The `.agents/skills/` directory may be out of sync with the source. To refresh, re‑add the skill or manually copy the `SKILL.md` files.
- **MCP bearer‑token handling**: For user‑scoped integrations, the MCP service must resolve the SecondMe user from the incoming bearer token – do not treat it as a static API key.
- **Project documentation**: Start from `doc/home.md` (entry). Core docs: `doc/a2a-personal-agent/architecture/v1.0.0/spec.md`, `doc/a2a-personal-agent/development/v1.0.0/tasks.md`, `doc/a2a-personal-agent/development/v1.0.0/checklist.md`.
- **Optimization tracking**: See `OPTIMIZATION.md` for comprehensive optimization report including 56 passing tests, security enhancements, and performance improvements.
- **Claude Code settings**: Permissions for `npx skills` and `curl` are allowed via `.claude/settings.local.json`.
- **TypeScript Configs**: `tsconfig.json` is for Next.js (no emit). `tsconfig.server.json` is for backend compilation (output to `dist/`).

## Reference Links

- [SecondMe Main Site](https://second‑me.cn/)
- [SecondMe Developer Documentation](https://develop‑docs.second.me/zh/docs)
- [OAuth2 Authentication Guide](https://develop‑docs.second.me/zh/docs/authentication/oauth2)
- [API Reference](https://develop‑docs.second.me/zh/docs/api‑reference/secondme)
