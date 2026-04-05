# THE HEIST — Project Architecture & Technical Specification

**Version:** 1.0
**Date:** April 3, 2026
**Status:** Pre-Development Planning

---

## 1. PRODUCT OVERVIEW

### 1.1 What It Is

A gamified, narrative-driven web application that teaches AI development skills (Python, SQL, Bash, vector databases, fine-tuning, and security) through heist-themed missions. Players write and execute real code in a sandboxed browser-based terminal to accomplish mission objectives.

### 1.2 Core Differentiator

Not a course with game elements. Not a chatbot you trick. A single-pane code execution environment where every mission has a clear objective, deterministic validation, and a compelling narrative arc. The closest analogues are HackTheBox/TryHackMe (for the sandboxed CTF format) and CodeCombat (for the learn-by-doing progression), but applied to AI/ML skills specifically.

### 1.3 Target Audience

Developers and aspiring AI entrepreneurs who want hands-on, practical AI development skills. They can write basic code but want to level up into data engineering, ML pipelines, vector databases, and security. They learn by doing, not watching.

### 1.4 Revenue Model (Future)

- Campaign 1 (3 missions): Free — validation & growth
- Campaign 2+ : Paid subscription ($19-29/mo) or per-campaign purchase
- Enterprise/bootcamp licensing: B2B
- Not relevant for v1 — build the game first, monetise once it's proven fun

---

## 2. NARRATIVE FRAMEWORK

### 2.1 Universe

The player is a freelance **AI Operative** — a specialist hired by corporations, governments, and private clients to investigate, build, break, and secure AI systems. Think a mix between a white-hat hacker and a forensic data scientist, operating in a near-future world where AI systems are critical infrastructure.

### 2.2 Narrative Structure

Each **Campaign** is a self-contained story arc (4-6 missions) with recurring characters, escalating stakes, and a final reveal. Missions within a campaign connect narratively — discoveries in Mission 1 set up the conflict in Mission 3.

### 2.3 Campaign 1: "PHANTOM LEDGER"

**Theme:** Financial crime and AI manipulation
**Story Arc:** A series of seemingly unrelated financial anomalies across different organisations are connected by a single adversary — an anonymous entity called "Specter" who is systematically exploiting AI systems in financial infrastructure.

**Mission 1: "The Ghost Ledger"** (Introductory)
A fintech startup's books don't balance. $2.3M missing. You trace it through server logs, messy databases, and a data pipeline that builds the evidence.
*Skills: Bash, SQL, Python*
*Narrative hook: At the end, you discover the money was routed through an account that traces back to a larger network. Your handler flags it — "This isn't just one startup. This is bigger."*

**Mission 2: "The Poisoned Well"** (Intermediate)
A healthcare AI assistant is giving subtly wrong drug interaction warnings. Three patients hospitalised. The knowledge base was tampered with — but by whom? You trace the ingestion pipeline, interrogate the vector store, and decontaminate the system.
*Skills: Bash, SQL, Python, Vector DB/RAG*
*Narrative hook: The poisoned documents were injected from the same IP range as the financial anomaly. The entity isn't just stealing money — they're testing attack vectors across industries.*

**Mission 3: "The Doppelgänger"** (Advanced)
A competitor has deployed a model that's impossibly good at predicting your client's trading strategies. You infiltrate their staging environment, prove data theft via membership inference, and build a detection system.
*Skills: All six — Bash, SQL, Python, Vector DB, Fine-tuning, Security*
*Narrative hook: The stolen model is part of Specter's arsenal. Campaign 1 ends with you identifying the pattern — but not the person. Campaign 2 opens the hunt.*

### 2.4 Narrative Delivery

No chatbots. Narrative is delivered through:

- **Mission Briefings** — Dossier-style documents that appear in the player's filesystem as `BRIEFING.md`
- **Intel Drops** — Files that appear mid-mission when you complete a stage (new evidence, handler notes, intercepted communications)
- **Environment Storytelling** — The filesystems, databases, and logs themselves tell the story. The cron job modifying records. The hidden directory. The suspicious ingestion log entry.
- **Completion Debriefs** — After each mission, a debrief document summarises what you found and sets up the next mission

---

## 3. SYSTEM ARCHITECTURE

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Terminal    │  │  Code Editor │  │  Mission      │  │
│  │  (xterm.js)  │  │  (Monaco)    │  │  Panel        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └────────┬────────┘                  │          │
│                  │                           │          │
│         ┌────────▼────────┐         ┌───────▼────────┐ │
│         │  WebSocket      │         │  REST API      │ │
│         │  (code exec)    │         │  (game state)  │ │
│         └────────┬────────┘         └───────┬────────┘ │
└──────────────────┼──────────────────────────┼──────────┘
                   │                          │
┌──────────────────┼──────────────────────────┼──────────┐
│                  │       BACKEND            │          │
│         ┌────────▼────────┐         ┌───────▼────────┐ │
│         │  Execution      │         │  Game Engine   │ │
│         │  Service        │         │  (Node/Python) │ │
│         └────────┬────────┘         └───────┬────────┘ │
│                  │                          │          │
│         ┌────────▼────────┐         ┌───────▼────────┐ │
│         │  Container      │         │  Validation    │ │
│         │  Orchestrator   │         │  Engine        │ │
│         │  (Docker API)   │         │                │ │
│         └────────┬────────┘         └───────┬────────┘ │
│                  │                          │          │
│     ┌────────────▼────────────┐     ┌───────▼────────┐ │
│     │  Player Containers      │     │  Supabase      │ │
│     │  (sandboxed, ephemeral) │     │  (state, auth, │ │
│     │  - Ubuntu base          │     │   missions,    │ │
│     │  - Python + libs        │     │   leaderboard) │ │
│     │  - PostgreSQL client    │     │                │ │
│     │  - Pre-seeded FS & DB   │     │                │ │
│     └─────────────────────────┘     └────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 3.2 Component Breakdown

#### Frontend — React + TypeScript

**Framework:** Next.js (App Router)
**Why:** SSR for landing/marketing pages, API routes for game logic, good DX with your existing React knowledge. Deployed on Vercel.

**Core Components:**

| Component | Library | Purpose |
|-----------|---------|---------|
| Terminal | xterm.js + xterm-addon-fit | Browser-based terminal connected via WebSocket to player container |
| Code Editor | Monaco Editor (@monaco-editor/react) | Tabbed file editor with syntax highlighting for Python, SQL, Bash, JSON, YAML |
| Mission Panel | Custom React | Objectives checklist, intel files, progress bar, timer, hints |
| File Explorer | Custom React | Tree view of player's container filesystem |
| Leaderboard | Custom React | Campaign/mission rankings, player stats |
| Auth | Supabase Auth (social + email) | Login, signup, session management |

**Layout:** Single-page application once in a mission. Three-pane layout:
- Left (25%): File explorer + Mission panel (tabbed)
- Centre (50%): Code editor with tabs
- Right (25%): Terminal

Player can resize panes. Terminal can be expanded to full width for pure Bash work. Editor can be expanded for Python/SQL work.

**State Management:** Zustand (lightweight, no boilerplate). Stores:
- `missionStore` — current mission, stage, objectives, completion state
- `editorStore` — open files, active tab, unsaved changes
- `terminalStore` — WebSocket connection state, history

#### Backend — Node.js (Express or Fastify)

**Why Node over Python for backend:** WebSocket handling, event-driven container orchestration, and your frontend is already JS/TS. Keep the stack unified. Python lives inside the player containers, not on your server.

**Core Services:**

| Service | Responsibility |
|---------|---------------|
| Auth Service | Wraps Supabase Auth, manages sessions and API keys |
| Mission Service | CRUD for missions, stage progression, hint unlocking |
| Execution Service | Container lifecycle: create, connect, destroy. WebSocket proxy between browser terminal and container |
| Validation Service | Runs validation checks against player container state (query results, file hashes, command outputs) |
| Scoring Service | Calculates scores (time, line count, bonus objectives), updates leaderboards |
| Container Orchestrator | Docker API wrapper: builds images, manages player containers, enforces resource limits, handles cleanup |

#### Execution Engine — Docker

This is the most critical and complex piece. Each player gets an isolated Docker container per mission.

**Base Image Spec (`heist-mission-base`):**

```dockerfile
FROM ubuntu:24.04

# System tools
RUN apt-get update && apt-get install -y \
    bash curl wget git vim nano less \
    postgresql-client \
    python3.12 python3-pip python3.12-venv \
    && rm -rf /var/lib/apt/lists/*

# Python packages (pre-installed for all missions)
RUN pip3 install --break-system-packages \
    pandas numpy scipy scikit-learn \
    psycopg2-binary sqlalchemy \
    sentence-transformers \
    pgvector \
    requests httpx \
    python-dotenv pyyaml

# Create player workspace
RUN mkdir -p /home/operative/workspace
WORKDIR /home/operative/workspace

# Resource limits enforced at container level:
# - 1 CPU core
# - 1GB RAM
# - 5GB disk
# - No network access (mission-specific exceptions)
# - 2-hour max lifetime
```

**Mission-specific layers:** Each mission has a Dockerfile that extends the base with:
- Pre-seeded filesystem (evidence files, config files, log files, scripts)
- Pre-seeded PostgreSQL database (either via mounted Supabase schema or embedded SQLite for simpler missions)
- Pre-installed mission-specific Python packages
- Running processes (cron jobs, monitoring scripts, simulated services)
- Environment variables (connection strings, API endpoints for simulated services)

**Container Lifecycle:**

```
Player clicks "Start Mission"
    → Backend creates container from mission image
    → Container starts with pre-seeded environment
    → WebSocket tunnel established (browser terminal ↔ container shell)
    → Player works in container
    → Player clicks "Submit Stage"
    → Validation Service runs checks inside container
    → Results returned, next stage unlocked (or feedback given)
    → After mission complete or timeout (2hrs), container destroyed
```

**Database for SQL Challenges:**

Two approaches (use based on mission complexity):

1. **Embedded PostgreSQL in container** — For missions where the player needs to query and modify a database. Heavier but more realistic. Use for Missions 2-3.
2. **Supabase isolated schemas** — Create a per-player schema in Supabase with the mission's seed data. Player connects via provided credentials. Lighter, easier to manage. Use for Mission 1.

Recommended: Start with approach 2 for MVP. Migrate to approach 1 if latency or isolation becomes a problem.

#### Database — Supabase (PostgreSQL)

**Application Schema (your app's data):**

```sql
-- Users & Auth (managed by Supabase Auth)
-- profiles table extends auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    rank TEXT DEFAULT 'recruit', -- recruit, operative, specialist, ghost, architect
    xp INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    narrative_intro TEXT,
    difficulty TEXT, -- beginner, intermediate, advanced
    mission_count INTEGER,
    is_free BOOLEAN DEFAULT false,
    sort_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Missions
CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    codename TEXT, -- "The Ghost Ledger"
    description TEXT,
    narrative_briefing TEXT, -- markdown, rendered as BRIEFING.md
    difficulty TEXT,
    sort_order INTEGER,
    stage_count INTEGER,
    skills TEXT[], -- ['bash', 'sql', 'python']
    docker_image TEXT NOT NULL, -- image tag for this mission
    time_limit_minutes INTEGER DEFAULT 120,
    par_time_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mission Stages
CREATE TABLE stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID REFERENCES missions(id),
    sort_order INTEGER NOT NULL,
    title TEXT NOT NULL,
    briefing TEXT NOT NULL, -- markdown
    skill_primary TEXT NOT NULL,
    skills_secondary TEXT[],
    objectives JSONB NOT NULL, -- array of objective definitions
    hints JSONB, -- array of {text, unlock_after_minutes}
    intel_drops JSONB, -- files that appear on completion
    par_time_minutes INTEGER,
    par_lines INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player Progress
CREATE TABLE player_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    mission_id UUID REFERENCES missions(id),
    status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
    current_stage INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    total_time_seconds INTEGER,
    container_id TEXT, -- active Docker container ID
    UNIQUE(user_id, mission_id)
);

-- Stage Completions (detailed scoring)
CREATE TABLE stage_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    stage_id UUID REFERENCES stages(id),
    mission_id UUID REFERENCES missions(id),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    time_seconds INTEGER,
    lines_of_code INTEGER,
    attempts INTEGER DEFAULT 1,
    score INTEGER, -- calculated from time, lines, bonus
    bonus_objectives JSONB, -- which bonuses achieved
    solution_hash TEXT -- hash of their solution for anti-cheat
);

-- Leaderboard (materialised view, refreshed on completion)
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
    p.username,
    p.display_name,
    p.rank,
    p.avatar_url,
    m.slug AS mission_slug,
    m.title AS mission_title,
    c.slug AS campaign_slug,
    SUM(sc.score) AS total_score,
    SUM(sc.time_seconds) AS total_time,
    COUNT(DISTINCT sc.mission_id) AS missions_completed
FROM stage_completions sc
JOIN profiles p ON p.id = sc.user_id
JOIN missions m ON m.id = sc.mission_id
JOIN campaigns c ON c.id = m.campaign_id
GROUP BY p.username, p.display_name, p.rank, p.avatar_url,
         m.slug, m.title, c.slug
ORDER BY total_score DESC;

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_completions ENABLE ROW LEVEL SECURITY;

-- Players can read own progress, read all leaderboard
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own progress"
    ON player_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own completions"
    ON stage_completions FOR SELECT USING (auth.uid() = user_id);
```

**Mission Sandbox Schema (per-player, per-mission):**

For SQL challenges, create isolated schemas:

```sql
-- Template: mission_1_ghost_ledger schema
-- Cloned per player session into: sandbox_{user_id}_{mission_id}

CREATE SCHEMA sandbox_template_ghost_ledger;

-- Seed tables with mission data
CREATE TABLE sandbox_template_ghost_ledger.accounts (...);
CREATE TABLE sandbox_template_ghost_ledger.transactions (...);
-- etc.

-- On mission start: clone schema for player
-- On mission end/timeout: drop player schema
```

#### Validation Engine

The validation engine runs inside the player's container (via `docker exec`) to check objective completion.

**Validator Types:**

```typescript
interface Validator {
    type: 'query_result_match' | 'file_output_match' |
          'file_hash_match' | 'command_output_match' |
          'model_accuracy_threshold' | 'process_running' |
          'file_exists' | 'file_permissions_match' |
          'json_schema_match';
    config: Record<string, any>;
}

// Examples:

// SQL: "Find the total diverted funds"
{
    type: 'query_result_match',
    config: {
        query: 'SELECT SUM(amount) FROM evidence WHERE flagged = true',
        expected: [{ sum: 2314887.43 }],
        tolerance: 0.01 // for floating point
    }
}

// Python: "Produce a cleaned CSV"
{
    type: 'file_hash_match',
    config: {
        path: '/home/operative/workspace/evidence.csv',
        expected_sha256: 'abc123...', // pre-computed
        // OR for partial match:
        expected_columns: ['timestamp', 'from_account', 'to_account', 'amount', 'method', 'user_id'],
        expected_row_count: 847,
        sort_column: 'timestamp'
    }
}

// Bash: "Find the suspicious cron job"
{
    type: 'command_output_match',
    config: {
        // We check if the player's submitted answer matches
        answer_field: 'cron_command',
        expected_contains: 'modify_ledger.sh',
    }
}

// Fine-tuning: "Classifier must achieve F1 > 0.85"
{
    type: 'model_accuracy_threshold',
    config: {
        script: '/opt/validation/eval_model.py', // pre-installed
        metric: 'f1_score',
        threshold: 0.85,
        test_data: '/opt/validation/test_set.csv'
    }
}
```

**Validation Flow:**

1. Player clicks "Check Objective" or "Submit Stage"
2. Backend runs validators via `docker exec` in player's container
3. Each validator returns `{passed: boolean, feedback: string, details: any}`
4. If all objectives pass → stage complete, intel drops delivered, next stage unlocked
5. If any fail → feedback displayed (e.g., "Your query returned 842 rows, expected 847. Check for duplicates.")

---

## 4. TECH STACK SUMMARY

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS | SSR for marketing, API routes, your existing skills |
| **Terminal** | xterm.js + xterm-addon-fit + xterm-addon-webgl | Industry-standard browser terminal |
| **Code Editor** | Monaco Editor (@monaco-editor/react) | VS Code engine, syntax highlighting, multi-tab |
| **State Mgmt** | Zustand | Lightweight, no boilerplate |
| **Backend** | Node.js (Fastify) | WebSocket perf, event-driven, unified stack |
| **WebSocket** | ws (Node) or Socket.io | Terminal ↔ container bridge |
| **Auth** | Supabase Auth | Social login, email, JWT, RLS |
| **Database** | Supabase (PostgreSQL) | App data + player sandbox schemas + pgvector |
| **Container Orchestration** | Docker Engine API (dockerode npm) | Player sandboxes, mission images |
| **Hosting (App)** | Vercel (frontend) + Railway or Fly.io (backend) | Vercel for Next.js, Railway/Fly for Docker-heavy backend |
| **Hosting (Containers)** | Dedicated VPS (Hetzner or DigitalOcean) | Need Docker daemon access, predictable pricing |
| **CI/CD** | GitHub Actions | Build images, run tests, deploy |
| **Monitoring** | Sentry (errors) + PostHog (analytics) | Free tiers sufficient for MVP |

---

## 5. INFRASTRUCTURE & DEPLOYMENT

### 5.1 Architecture Decision: Where Do Player Containers Run?

This is the most consequential infrastructure decision.

**Option A: Single VPS with Docker**
- Hetzner CCX23 (4 vCPU, 16GB RAM, ~$30/mo) or equivalent
- Can run ~12-15 concurrent player containers (1 CPU, 1GB each)
- Simple, cheap, good for MVP
- Limitation: doesn't scale past ~15 concurrent players

**Option B: Fly.io Machines API**
- Spin up containers on demand, pay per second
- Better scaling, geographic distribution
- More complex setup, slightly higher cost at low volume
- Better for post-MVP growth

**Recommendation:** Start with Option A. A single Hetzner VPS can handle your first few hundred users (most won't be concurrent). Migrate to Option B when concurrency becomes a real problem. Don't over-engineer infrastructure before validating the game is fun.

### 5.2 Container Resource Limits

```yaml
# Per-player container constraints
resources:
  cpu: 1.0          # 1 core
  memory: 1024m     # 1GB RAM
  disk: 5g          # 5GB storage
  pids: 256         # max processes
  timeout: 7200s    # 2-hour max lifetime

network:
  mode: none         # no external network by default
  # Mission-specific exceptions:
  # - Mission 2: allow localhost:5432 (embedded Postgres)
  # - Mission 3: allow simulated "competitor server" (another container)

security:
  read_only_rootfs: false  # players need to write files
  no_new_privileges: true
  cap_drop: [ALL]
  cap_add: [CHOWN, SETUID, SETGID]  # minimum for PostgreSQL
```

### 5.3 Container Cleanup Strategy

- **On mission complete:** container removed after 5-minute grace period
- **On timeout (2hrs):** container force-removed, player progress saved up to last completed stage
- **On disconnect:** container kept alive for 30 minutes (reconnection window), then removed
- **Zombie cleanup cron:** every 15 minutes, remove containers older than 2.5 hours
- **Daily cleanup:** remove all containers, rebuild base images, clean Docker cache

---

## 6. SCORING & PROGRESSION

### 6.1 Scoring Formula

```
stage_score = base_points
            + time_bonus(par_time, actual_time)
            + efficiency_bonus(par_lines, actual_lines)
            + sum(bonus_objectives)

time_bonus = max(0, (par_time - actual_time) / par_time * 100)
efficiency_bonus = max(0, (par_lines - actual_lines) / par_lines * 50)
```

Each bonus objective is worth a fixed point value defined per stage.

### 6.2 Rank Progression

| Rank | XP Required | Unlocks |
|------|-------------|---------|
| Recruit | 0 | Campaign 1 access |
| Operative | 500 | Campaign 2, profile badge |
| Specialist | 1500 | Campaign 3, custom avatar |
| Ghost | 4000 | Campaign 4, community features |
| Architect | 10000 | Mission creation tools (future) |

### 6.3 Anti-Cheat (Light)

- Solution hashing (detect copied solutions)
- Time-based anomaly detection (completing a 20-minute stage in 30 seconds)
- No network access in containers (can't phone a friend/GPT during mission)
- Not a priority for MVP — invest here only if the game gains traction

---

## 7. MISSION CONTENT PIPELINE

### 7.1 Mission Definition Format

Each mission is defined as a directory:

```
missions/
  ghost-ledger/
    mission.yaml          # metadata, stages, objectives, validators
    Dockerfile            # extends heist-mission-base
    seed/
      filesystem/         # files placed in player container
        BRIEFING.md
        .env              # hidden 3 levels deep
        logs/
          access.log
          cron.log
        .transactions/    # hidden directory
          tx_001.json
          tx_002.json
          ...
      database/
        schema.sql        # CREATE TABLE statements
        seed.sql          # INSERT statements (50K transactions)
      scripts/
        modify_ledger.sh  # the cron job players discover
    validation/
      stage_1_validators.yaml
      stage_2_validators.yaml
      stage_3_validators.yaml
      expected/
        evidence.csv      # expected output for file hash comparison
    intel/
      stage_1_complete.md   # intel drop after stage 1
      stage_2_complete.md
      debrief.md           # post-mission debrief
```

### 7.2 mission.yaml Schema

```yaml
id: ghost-ledger
title: "The Ghost Ledger"
codename: "PHANTOM-001"
campaign: phantom-ledger
difficulty: introductory
time_limit_minutes: 120
skills: [bash, sql, python]

narrative:
  briefing: |
    A fintech startup called NovaPay has a $2.3M discrepancy between
    their internal ledger and public filings. The board hired you
    to find where the money went — quietly.

    Your handler has arranged SSH access to their dev server.
    Credentials are somewhere in the environment. Start there.
  
  completion: |
    The evidence is compiled. $2,314,887.43 diverted across 847
    transactions by a single operator using off-hours ghost entries.
    
    But here's what's interesting — the destination account
    routes through a shell company registered in Estonia. Your
    handler flagged it: the same shell appears in three other
    cases across different industries.
    
    This isn't a rogue employee. This is infrastructure.
    
    Stand by for your next assignment.

stages:
  - id: gain-your-bearings
    sort_order: 1
    title: "Gain Your Bearings"
    skill_primary: bash
    briefing: |
      You have SSH access. Find the database credentials,
      identify running services, and locate anything suspicious.
    objectives:
      - id: find-credentials
        description: "Find the database connection string"
        validator:
          type: answer_match
          config:
            prompt: "Enter the database connection string you found:"
            expected_contains: "postgresql://novapay_admin"
      - id: find-cron
        description: "Identify the suspicious cron job command"
        validator:
          type: answer_match
          config:
            prompt: "What command is the suspicious cron job running?"
            expected_contains: "modify_ledger.sh"
      - id: count-transactions
        description: "Count the files in the hidden .transactions directory"
        validator:
          type: answer_match
          config:
            prompt: "How many files are in the hidden directory?"
            expected: "847"
      - id: check-permissions
        description: "Who has write access to the audit log?"
        validator:
          type: answer_match
          config:
            prompt: "Which user has write access to audit.log?"
            expected: "ghost_svc"
    hints:
      - text: "Hidden directories start with a dot. Try `find` with flags for hidden files."
        unlock_after_minutes: 5
      - text: "Check /etc/crontab and also user-level crontabs with `crontab -l -u`"
        unlock_after_minutes: 8
    par_time_minutes: 8
    par_lines: 12

  - id: follow-the-money
    sort_order: 2
    title: "Follow the Money"
    skill_primary: sql
    # ... (full definition follows same pattern)

  - id: build-the-evidence
    sort_order: 3
    title: "Build the Evidence"
    skill_primary: python
    skills_secondary: [sql, bash]
    # ... (full definition follows same pattern)
```

---

## 8. PROJECT STRUCTURE

```
the-heist/
├── CLAUDE.md                    # Claude Code project instructions
├── README.md
├── package.json                 # monorepo root (npm workspaces)
├── turbo.json                   # Turborepo config
│
├── apps/
│   ├── web/                     # Next.js frontend
│   │   ├── app/
│   │   │   ├── (marketing)/     # landing page, about, pricing
│   │   │   ├── (auth)/          # login, signup
│   │   │   ├── (game)/          # main game interface
│   │   │   │   ├── campaigns/
│   │   │   │   ├── missions/
│   │   │   │   │   └── [slug]/
│   │   │   │   │       └── page.tsx  # the mission interface
│   │   │   │   ├── leaderboard/
│   │   │   │   └── profile/
│   │   │   └── api/             # Next.js API routes
│   │   ├── components/
│   │   │   ├── terminal/        # xterm.js wrapper
│   │   │   ├── editor/          # Monaco wrapper
│   │   │   ├── mission-panel/   # objectives, hints, intel
│   │   │   ├── file-explorer/   # container filesystem tree
│   │   │   └── ui/              # shared UI components
│   │   ├── stores/              # Zustand stores
│   │   ├── lib/                 # utilities, API clients
│   │   └── hooks/               # custom React hooks
│   │
│   └── server/                  # Backend (Fastify)
│       ├── src/
│       │   ├── services/
│       │   │   ├── auth.ts
│       │   │   ├── mission.ts
│       │   │   ├── execution.ts       # container lifecycle
│       │   │   ├── validation.ts      # run validators
│       │   │   ├── scoring.ts
│       │   │   └── websocket.ts       # terminal bridge
│       │   ├── routes/
│       │   ├── middleware/
│       │   └── utils/
│       ├── Dockerfile                  # server deployment
│       └── package.json
│
├── packages/
│   ├── shared/                  # shared types, constants
│   │   ├── types/
│   │   │   ├── mission.ts
│   │   │   ├── validation.ts
│   │   │   └── scoring.ts
│   │   └── constants/
│   │
│   └── mission-sdk/             # tools for creating missions
│       ├── validators/
│       ├── seed-generators/
│       └── testing/             # local mission testing
│
├── missions/                    # mission content (separate from app code)
│   ├── ghost-ledger/
│   │   ├── mission.yaml
│   │   ├── Dockerfile
│   │   ├── seed/
│   │   ├── validation/
│   │   └── intel/
│   ├── poisoned-well/
│   └── doppelganger/
│
├── docker/
│   ├── base/
│   │   └── Dockerfile           # heist-mission-base image
│   └── compose/
│       └── docker-compose.dev.yaml  # local dev environment
│
├── supabase/
│   ├── migrations/              # database migrations
│   ├── seed.sql                 # dev seed data
│   └── config.toml
│
└── scripts/
    ├── build-missions.sh        # build all mission Docker images
    ├── seed-mission-db.sh       # seed a mission's sandbox DB
    └── test-mission.sh          # run a mission locally for testing
```

---

## 9. DEVELOPMENT PLAN

### Phase 0: Foundation (Week 1)
- [ ] Initialise monorepo (npm workspaces + Turborepo)
- [ ] Set up Next.js app with Tailwind, basic routing
- [ ] Set up Supabase project, run initial migrations
- [ ] Set up Fastify backend with WebSocket support
- [ ] Build and test `heist-mission-base` Docker image
- [ ] Configure CI/CD (GitHub Actions: lint, test, build)
- [ ] Write CLAUDE.md with full project context

### Phase 1: Core Engine (Weeks 2-3)
- [ ] Implement container orchestration (create, connect, destroy)
- [ ] Build WebSocket bridge (browser terminal ↔ container shell)
- [ ] Implement xterm.js terminal component
- [ ] Implement Monaco editor component with file loading
- [ ] Build file explorer (reads container filesystem via API)
- [ ] Implement Supabase Auth flow (signup, login, profile)
- [ ] Build basic mission panel UI (objectives, briefing)

### Phase 2: Mission 1 — "The Ghost Ledger" (Weeks 3-4)
- [ ] Write mission narrative content (briefing, intel drops, debrief)
- [ ] Build mission Docker image with seeded filesystem
- [ ] Generate seed data (50K transactions, accounts, users, audit logs)
- [ ] Create the hidden cron job and suspicious files
- [ ] Implement Stage 1 validators (Bash objectives)
- [ ] Implement Stage 2 validators (SQL objectives)
- [ ] Implement Stage 3 validators (Python + file output)
- [ ] Build stage progression flow (complete → intel drop → next stage)
- [ ] Build completion flow (debrief, scoring, save results)
- [ ] Playtest extensively — is it fun? Is the feedback loop tight?

### Phase 3: Polish & Ship MVP (Week 5)
- [ ] Landing page (what is this, who is it for, try for free)
- [ ] Leaderboard (basic: mission times, scores)
- [ ] Profile page (completed missions, rank, stats)
- [ ] Hint system (time-gated unlocks)
- [ ] Error handling and edge cases (container crashes, disconnects, timeouts)
- [ ] Mobile responsiveness (at minimum: "this works best on desktop" message)
- [ ] Deploy: Vercel (frontend) + VPS (backend + Docker)
- [ ] Ship MVP with Mission 1 only

### Phase 4: Expand (Weeks 6-8)
- [ ] Build Mission 2 — "The Poisoned Well" (adds vector DB skills)
- [ ] Build Mission 3 — "The Doppelgänger" (adds fine-tuning + security)
- [ ] Campaign narrative arc (connecting thread across missions)
- [ ] Enhanced scoring (par system, bonus objectives)
- [ ] Social features (share completion, challenge a friend)
- [ ] Analytics (where do players get stuck? drop off?)

---

## 10. CLAUDE.md TEMPLATE

```markdown
# THE HEIST — Project Context for Claude Code

## What This Is
A gamified web app teaching AI development skills through heist-themed
missions. Players write real Python, SQL, and Bash in sandboxed Docker
containers to accomplish mission objectives.

## Tech Stack
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand
- Terminal: xterm.js
- Code Editor: Monaco Editor
- Backend: Fastify (Node.js), WebSocket (ws)
- Database: Supabase (PostgreSQL + pgvector + Auth)
- Containers: Docker Engine API via dockerode
- Deployment: Vercel (frontend), Hetzner VPS (backend + Docker)

## Project Structure
[paste the tree from Section 8]

## Key Architecture Decisions
1. Player code runs in isolated Docker containers, NOT on the server
2. WebSocket bridges browser terminal to container shell
3. Validation runs server-side via `docker exec`
4. Mission content is data (YAML + seed files), not code
5. Supabase handles auth, game state, AND sandbox databases

## Code Conventions
- TypeScript strict mode everywhere
- Functional components only (React)
- Zustand for client state, no Context API
- Server-side: Fastify with TypeScript
- All database queries through Supabase client (not raw SQL in app code)
- Mission content: YAML for config, SQL for seeds, Markdown for narrative

## Current Phase
[UPDATE THIS AS YOU PROGRESS]

## What NOT To Do
- Don't use prompt engineering or chatbot interfaces in the game
- Don't use Server Components for the game interface (needs client-side WebSocket)
- Don't put mission seed data in the app database — it lives in Docker images
- Don't expose Docker socket to the frontend
- Don't skip validation — every objective needs a working validator before ship
```

---

## 11. RISK REGISTER

| Risk | Severity | Mitigation |
|------|----------|------------|
| Container escape (player breaks out of sandbox) | High | No network, cap_drop ALL, resource limits, read-only system dirs |
| Container resource exhaustion (fork bomb, memory leak) | High | PID limit, memory limit, CPU limit, 2hr timeout |
| Mission is boring / feels like homework | Critical | Playtest early. Narrative must carry. Feedback loops must be tight. If a stage takes >10 mins without a "win" feeling, redesign it |
| Seed data quality (SQL challenges have bugs) | Medium | Automated tests for seed data. Run all validators against known-good solutions before shipping |
| WebSocket reliability (disconnects during mission) | Medium | Reconnection logic, container kept alive 30 mins after disconnect, progress saved per-stage |
| Scale (too many concurrent containers) | Low (MVP) | Start on dedicated VPS, monitor utilisation, migrate to Fly.io Machines when needed |
| Cheating (sharing solutions) | Low (MVP) | Solution hashing, time anomaly detection. Not a priority until community exists |

---

## 12. SUCCESS METRICS (MVP)

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| Mission 1 completion rate | > 60% of starters | If < 60%, the difficulty curve is wrong |
| Time to first "win" (Stage 1 complete) | < 15 minutes | If longer, onboarding friction is too high |
| Session length | > 30 minutes average | Indicates engagement |
| Return rate | > 40% come back for another session | Indicates the game is fun, not just novel |
| NPS / qualitative feedback | "I felt clever" moments | The core emotion that drives retention |

---

*End of Architecture Document*
