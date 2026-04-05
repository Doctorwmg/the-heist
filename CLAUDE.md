# THE HEIST

## What This Is
A gamified web app that teaches AI development skills (Python, SQL, Bash, vector databases, fine-tuning, security) through heist-themed missions. Players write and execute real code in sandboxed Docker containers via a browser-based terminal and code editor.

## Tech Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Zustand
- **Terminal:** xterm.js (xterm-addon-fit, xterm-addon-webgl)
- **Code Editor:** Monaco Editor (@monaco-editor/react)
- **Backend:** Fastify (Node.js), WebSocket (ws library)
- **Database:** Supabase (PostgreSQL + pgvector + Auth + RLS)
- **Containers:** Docker Engine API via `dockerode` npm package
- **Deployment:** Vercel (frontend), Hetzner VPS (backend + Docker)
- **Monorepo:** npm workspaces + Turborepo

## Project Structure
```
the-heist/
├── CLAUDE.md
├── package.json              # monorepo root
├── turbo.json
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── app/
│   │   │   ├── (marketing)/  # landing, about
│   │   │   ├── (auth)/       # login, signup
│   │   │   └── (game)/       # mission interface, leaderboard, profile
│   │   ├── components/
│   │   │   ├── terminal/     # xterm.js wrapper
│   │   │   ├── editor/       # Monaco wrapper
│   │   │   ├── mission-panel/
│   │   │   ├── file-explorer/
│   │   │   └── ui/           # shared components
│   │   ├── stores/           # Zustand stores
│   │   ├── lib/              # utils, API clients, Supabase client
│   │   └── hooks/
│   └── server/               # Fastify backend
│       └── src/
│           ├── services/     # auth, mission, execution, validation, scoring, websocket
│           ├── routes/
│           ├── middleware/
│           └── utils/
├── packages/
│   ├── shared/               # shared types, constants
│   └── mission-sdk/          # mission creation tools, validators
├── missions/                 # mission content (YAML + seed files + Dockerfiles)
│   ├── ghost-ledger/
│   ├── poisoned-well/
│   └── doppelganger/
├── docker/
│   ├── base/Dockerfile       # heist-mission-base image
│   └── compose/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── docs/
│   └── ARCHITECTURE.md       # full architecture reference
└── scripts/
```

## Architecture Decisions (Non-Negotiable)
1. Player code runs in **isolated Docker containers**, never on the server
2. **WebSocket** bridges browser terminal (xterm.js) to container shell
3. Validation runs **server-side** via `docker exec` against player container
4. Mission content is **data** (YAML + seed files + Dockerfiles), not application code
5. Supabase handles auth, game state, leaderboards, AND sandbox databases for SQL challenges
6. **Single-page app** once inside a mission — three-pane layout: file explorer + mission panel (left 25%), code editor (centre 50%), terminal (right 25%). Panes resizable.
7. **No chatbots, no prompt engineering, no AI chat interface in the game.** Pure terminal + code editor. Narrative delivered through filesystem files (BRIEFING.md, intel drops) and environment storytelling.

## Code Conventions
- TypeScript strict mode everywhere
- Functional React components only, no class components
- Zustand for client state (missionStore, editorStore, terminalStore)
- Fastify with TypeScript on the backend
- All app database queries through Supabase client, not raw SQL in app code
- Mission content: YAML for config, SQL for seed data, Markdown for narrative
- Use `dockerode` for all Docker API interactions
- ESLint + Prettier enforced

## Key Technical Patterns

### Container Lifecycle
```
Player clicks "Start Mission"
  → Backend creates container from mission-specific Docker image
  → Container starts with pre-seeded filesystem + database
  → WebSocket tunnel: browser terminal ↔ container shell
  → Player works in container
  → Player clicks "Submit Stage"
  → Validation Service runs checks inside container via docker exec
  → Pass → intel drop delivered, next stage unlocked
  → Fail → feedback displayed with hints
  → Mission complete or timeout (2hrs) → container destroyed
```

### Validation Types
- `query_result_match` — SQL output matches expected
- `file_hash_match` — file SHA-256 or schema matches expected
- `command_output_match` — bash command output contains expected string
- `answer_match` — player submits answer matching expected value
- `model_accuracy_threshold` — ML model hits performance target on hidden test set
- `file_exists` / `file_permissions_match` / `json_schema_match`

### Database Tables (Supabase)
- `profiles` — extends auth.users (username, rank, xp, avatar)
- `campaigns` — campaign metadata
- `missions` — mission metadata, docker_image ref, skills, par times
- `stages` — per-mission stages with objectives JSONB, hints, intel drops
- `player_progress` — per-user per-mission status, current stage, container_id
- `stage_completions` — detailed scoring per stage completion
- `leaderboard` — materialised view

### Scoring
```
stage_score = base_points + time_bonus + efficiency_bonus + bonus_objectives
time_bonus = max(0, (par_time - actual_time) / par_time * 100)
efficiency_bonus = max(0, (par_lines - actual_lines) / par_lines * 50)
```

### Rank Progression
Recruit (0 XP) → Operative (500) → Specialist (1500) → Ghost (4000) → Architect (10000)

## What NOT To Do
- Don't use Server Components for the game interface (needs client-side WebSocket)
- Don't put mission seed data in the app database — it lives in Docker images
- Don't expose Docker socket to the frontend — all container ops go through backend API
- Don't skip validation — every objective needs a working validator before shipping
- Don't add a chatbot or AI assistant to the game interface
- Don't use Context API — use Zustand
- Don't use Socket.io — use raw `ws` library for WebSocket (lighter, no overhead)

## Current Phase
Phase 0: Foundation — initialise monorepo, set up Next.js + Fastify + Supabase + Docker base image

## Full Reference
See `docs/ARCHITECTURE.md` for complete architecture details including:
- Full database schema with RLS policies
- Docker base image Dockerfile spec
- Mission YAML schema
- All three mission designs (Ghost Ledger, Poisoned Well, Doppelgänger)
- Narrative framework and campaign story arc
- Infrastructure and deployment details
- Risk register and success metrics
