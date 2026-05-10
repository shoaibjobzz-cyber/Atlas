# Requirements Intelligence Platform

Desktop-first engineering application for deterministic, traceable requirements analysis.

## Product Scope

This MVP focuses on:
- project CRUD with persisted project records
- project-oriented requirement authoring
- rule-based quality checking
- deterministic structured parsing
- requirement correlation and conflict detection
- linked design parameter management
- deterministic feasibility assessment
- traceability views with evidence-first feedback

## Stack

- Frontend: React + TypeScript + MUI + Vite
- Backend: FastAPI + Python + SQLAlchemy
- Database: PostgreSQL
- Local orchestration: Docker Compose

## Repository Structure

- `frontend/`
  React application, typed API client, MUI UI, Vitest component tests
- `backend/`
  FastAPI app, routers/schemas/services/models structure, pytest unit tests
- `infra/`
  local repo helpers such as hook installation
- `.githooks/`
  lightweight pre-commit hook scripts
- `docker-compose.yml`
  local frontend/backend/PostgreSQL stack

## Architecture

```mermaid
flowchart LR
    UI["React + MUI Frontend"] --> API["FastAPI Routers"]
    API --> Services["Deterministic Services Layer"]
    Services --> Models["SQLAlchemy Models"]
    Models --> DB["PostgreSQL"]

    Services --> Projects["Project Service"]
    Services --> Quality["Quality Rules"]
    Services --> Parser["Structured Parser"]
    Services --> Correlation["Correlation Engine"]
    Services --> DesignData["Design Data Module"]
    Services --> Feasibility["Feasibility Engine"]
    Services --> Demo["Demo Seed Loader"]
```

## Main MVP Flows

- Landing page -> load the braking-system demo -> open dashboard
- Dashboard navigation -> Validation -> project-level validation rollup -> requirement detail or traceability
- Dashboard navigation -> Reports -> project-level report preview -> copy or export markdown
- Dashboard navigation -> Traceability Graph -> visual relationship map -> click node to open requirement detail
- Dashboard navigation -> Traceability Matrix -> tabular relationship review -> open detail or traceability from each row
- Dashboard navigation -> Generate Requirements -> create AI-labeled draft candidates -> review validation outputs -> selectively save
- Requirements list -> requirement detail -> structured view -> traceability
- Requirement detail or editor -> Improve -> review AI rewrite suggestions with validation preview -> accept into editor -> save explicitly
- Requirement editor -> live quality warnings -> save -> detail review
- Design data -> link parameters to requirements -> feasibility and evidence on requirement detail
- Correlation + feasibility outputs -> traceability tab -> copy or export summary

## Frontend Performance Notes

- Heavier routed views are lazy-loaded to reduce the startup bundle:
  - Validation
  - Reports
  - Traceability Graph
  - Traceability Matrix
  - Generate Requirements
  - Design Data
- The graph visualization dependency is split into its own deferred chunk so it does not inflate the main startup path.

## Core Feature Areas

- Requirements CRUD
- Project CRUD
- Requirement quality checker
- Structured requirement parser
- Requirement correlation engine
- Design data module
- Feasibility engine
- Requirement generation workflow with provider abstraction and deterministic mock provider
  with persisted generation provenance metadata
- Real external LLM integration for requirement generation and decomposition via OpenAI, with mock fallback support
- Agent-based requirement validation scaffold using the OpenAI Agents SDK, retrieval over indexed source-document chunks, and explicit nano-to-mini routing
- Project-level aggregation endpoints for Validation, Reports, Traceability Graph, and Traceability Matrix views
- Historical validation and report snapshots with project-scoped storage and lightweight current-vs-snapshot comparison
- Validation traceability view
- Traceability graph view
- Traceability matrix view
- Demo braking-system dataset

## Prerequisites

- Docker Desktop
- Docker Compose
- Node.js 20+ for local frontend tooling
- Python 3.12 for local backend tooling

## Local Setup

1. Create the root environment file if it does not already exist:

```powershell
Copy-Item .env.example .env
```

2. For Docker Compose, the backend uses the `db` hostname from:
- [`backend/.env.example`](C:\Users\shoai\OneDrive\Documents\ATLAS\requirements-intelligence-platform\backend\.env.example)

3. Start the full stack:

```powershell
docker compose up --build
```

4. Load the MVP demo from the landing page:

- `Load Demo Project`

## Authentication

The app now uses a practical MVP cookie-session flow with a seeded local account.

Default local credentials:
- username: `demo`
- password: `demo1234`

For MVP, owner-only access is enforced for:
- projects
- requirements
- design parameters
- validation/report snapshots
- project-level views
- generation and demo-loading flows

## Service URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Backend OpenAPI docs: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

## Online Test Deployment

Atlas can be deployed for shared testing with:
- Frontend: Vercel or Render Static Site
- Backend: Render Web Service
- Database: Render PostgreSQL

### Required environment variables

Frontend:
- `VITE_API_BASE_URL`
  deployed backend URL, for example `https://atlas-backend.onrender.com`

Backend:
- `DATABASE_URL`
  Render PostgreSQL connection string
- `FRONTEND_ORIGINS`
  deployed frontend URL, for example `https://atlas-frontend.onrender.com`
- `FRONTEND_ORIGIN_REGEX`
  optional regex for preview deployments, for example `^https://.*\.vercel\.app$`
- `AUTH_COOKIE_SECURE`
  use `true` in hosted environments
- `AUTH_COOKIE_SAMESITE`
  use `none` in hosted environments when frontend and backend are on different domains
- `REQUIREMENT_GENERATION_PROVIDER`
  recommended hosted demo default: `mock`
- `REQUIREMENT_GENERATION_FALLBACK_TO_MOCK`
  recommended hosted demo default: `true`
- `OPENAI_API_KEY`
  optional, only if you want real OpenAI-backed generation

### Render deployment

The repo now includes:
- `render.yaml`

Suggested flow:

1. Push the repository to GitHub.
2. In Render, create a Blueprint from the repo, or create services manually using the same values from `render.yaml`.
3. Create or confirm the Render PostgreSQL database.
4. Set backend environment values:
   - `FRONTEND_ORIGINS=https://your-frontend-host`
   - optionally `FRONTEND_ORIGIN_REGEX=^https://.*\.vercel\.app$`
   - `AUTH_COOKIE_SECURE=true`
   - `AUTH_COOKIE_SAMESITE=none`
5. Set frontend environment values:
   - `VITE_API_BASE_URL=https://your-backend-host`
6. Deploy the backend.
   - backend startup automatically runs `python run_migrations.py upgrade head`
   - then starts Uvicorn through `backend/start.sh`
7. Deploy the frontend static site.

### Vercel frontend deployment

The repo now includes:
- `vercel.json`

Suggested flow:

1. Import the repository into Vercel.
2. Set the project root to:
   - `frontend`
3. Set:
   - `VITE_API_BASE_URL=https://your-backend-host`
4. Build with:
   - `npm install && npm run build`
5. Keep the backend CORS list aligned with the deployed Vercel URL.

### Demo seed data

Hosted demo/test environments can safely load deterministic demo data through the existing demo flows:
- `Load Demo Project`
- `Load Platform Demo`

No local/private data should be committed or required for deployment.

## Frontend Local Commands

From:
`C:\Users\shoai\OneDrive\Documents\ATLAS\requirements-intelligence-platform\frontend`

Install dependencies:

```powershell
npm install
```

Run dev server:

```powershell
npm run dev
```

Build:

```powershell
npm run build
```

Run tests:

```powershell
npm run test
```

Run lint:

```powershell
npm run lint
```

Check formatting:

```powershell
npm run format:check
```

Apply formatting:

```powershell
npm run format
```

## Backend Local Commands

From:
`C:\Users\shoai\OneDrive\Documents\ATLAS\requirements-intelligence-platform\backend`

Install runtime + dev dependencies:

```powershell
python -m pip install -r requirements-dev.txt
```

If you previously installed older pinned versions of `openai` or `pydantic`, reinstall from the
requirements files rather than adding `openai-agents` separately. The agent-validation scaffold
expects the compatible dependency set in:
- [backend/requirements.txt](C:\Users\shoai\OneDrive\Documents\ATLAS\requirements-intelligence-platform\backend\requirements.txt)

If you run backend commands directly on Windows instead of inside Docker Compose,
set a local-host database URL first:

```powershell
$env:DATABASE_URL="postgresql+psycopg://requirements_app:requirements_app@localhost:5432/requirements_intelligence"
$env:REQUIREMENT_GENERATION_PROVIDER="mock"
```

To use the real OpenAI-backed generation provider locally:

```powershell
$env:REQUIREMENT_GENERATION_PROVIDER="openai"
$env:OPENAI_API_KEY="your_api_key_here"
$env:OPENAI_MODEL="gpt-4.1-mini"
$env:REQUIREMENT_GENERATION_FALLBACK_TO_MOCK="true"
```

Then make sure the Postgres container is running:

```powershell
cd C:\Users\shoai\OneDrive\Documents\ATLAS\requirements-intelligence-platform
docker compose up -d db
cd backend
```

Run migrations:

```powershell
python run_migrations.py upgrade head
```

Run backend locally:

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Run tests:

```powershell
python -m pytest tests
```

Run lint:

```powershell
python -m ruff check app tests
```

Create a new migration revision when needed:

```powershell
python run_migrations.py revision -m "describe change"
```

## API Docs

The FastAPI OpenAPI UI is available at:

- [http://localhost:8000/docs](http://localhost:8000/docs)

Key API groups:

- `GET /health`
  service readiness
- `Auth`
  sign in, sign out, and current user session retrieval
- `Projects`
  create, list, view, update, and delete persisted project records
- `Requirements`
  CRUD plus correlation lookups
- `Requirement Generation`
  provider-based generation, decomposition, persisted generation metadata, draft review, selective save flow, and rewrite-suggestion backend support
- `Agent Validation`
  document upload, document indexing, retrieval-backed requirement validation, and rewrite suggestions through the OpenAI Agents SDK scaffold
- `Project Views`
  backend aggregation endpoints for project-level validation summary, report summary, traceability graph data, and traceability matrix data
- `Project Snapshots`
  create, list, view, and compare stored validation/report snapshots for each project
- `Traceability Graph`
  visual project-level requirement graph with parent-child, related, conflict, and generated/manual provenance cues
- `Traceability Matrix`
  tabular project-level relationship review with counts, feasibility status, linked evidence counts, and provenance
- `Quality`
  deterministic requirement-quality checks
- `Design Parameters`
  CRUD and requirement linking
- `Feasibility`
  deterministic feasibility evaluation
- `Demo`
  load the braking-system demo dataset

## Database Migrations

Alembic is configured under:
- `backend/alembic.ini`
- `backend/alembic/`

Normal local migration flow:

```powershell
cd C:\Users\shoai\OneDrive\Documents\ATLAS\requirements-intelligence-platform\backend
python run_migrations.py upgrade head
```

Docker backend startup now runs:
- `python run_migrations.py upgrade head`
- then starts the FastAPI app

If you run migrations locally from Windows, use `localhost:5432`.
If the backend runs inside Docker Compose, use `db:5432`.

## Historical Snapshots

Validation and Reports now support project-scoped historical snapshots.

Supported MVP actions:
- create a validation snapshot from the current live validation summary
- create a report snapshot from the current live report summary
- list stored snapshots by project and type
- open a historical snapshot in-place on the Validation or Reports page
- compare the current live state against a selected snapshot with lightweight numeric deltas

Snapshot payloads are stored as persisted JSON so historical views do not depend on rerunning the current aggregation logic later.

## Agent Validation Scaffold

The backend now includes a separate agent-validation module under:
- `backend/app/services/agent_validation/`

It is intentionally isolated from the deterministic MVP validation engine so the app can
evolve into multiple specialized agents later without redesigning the current requirement,
correlation, or feasibility services.

### Agent Roles

- `ingest_agent`
  normalizes uploaded document text, chunks it, and prepares it for indexing
- `retrieval_agent`
  embeds the live requirement text and fetches only the top relevant chunks
- `triage_agent`
  uses `gpt-5.4-nano` for cheap completeness, format, ambiguity, and duplicate triage
- `deep_review_agent`
  uses `gpt-5.4-mini` for contradiction analysis, evidence-based reasoning, traceability
  suggestions, and rewrite-ready findings
- `rewrite_agent`
  uses `gpt-5.4-mini` for structured rewrite suggestions
- `router`
  keeps routing policy explicit in Python rather than hidden in prompt behavior

### Agent Routing Logic

1. Documents are uploaded and stored in the in-memory document store.
2. Documents are indexed into text chunks with `text-embedding-3-small`.
3. Validation retrieves only the top relevant chunks for the current requirement text.
4. `triage_agent` always runs first with `gpt-5.4-nano`.
5. Escalation to `deep_review_agent` happens only if:
   - triage explicitly asks for escalation
   - triage confidence is below `AGENT_TRIAGE_CONFIDENCE_THRESHOLD`
   - triage finds a high-severity issue
   - triage returns `fail`
6. The frontend can render the final structured JSON directly because the response already
   includes issues, evidence references, route taken, and rewrite-ready output fields.

### Agent Validation Environment Variables

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
$env:AGENT_TRIAGE_MODEL="gpt-5.4-nano"
$env:AGENT_DEEP_REVIEW_MODEL="gpt-5.4-mini"
$env:AGENT_EMBEDDING_MODEL="text-embedding-3-small"
$env:AGENT_TOP_K_CHUNKS="5"
$env:AGENT_TRIAGE_CONFIDENCE_THRESHOLD="0.78"
```

Optional tuning:
- `AGENT_CHUNK_SIZE`
- `AGENT_CHUNK_OVERLAP`
- `AGENT_MAX_RETRIEVED_CHARS`
- `AGENT_MAX_DUPLICATE_CANDIDATES`
- `AGENT_OPENAI_TIMEOUT_SECONDS`
- `AGENT_OPENAI_MAX_RETRIES`

### Agent Validation Local Testing Flow

1. Start PostgreSQL:

```powershell
cd C:\Users\shoai\OneDrive\Documents\ATLAS\requirements-intelligence-platform
docker compose up -d db
```

2. Run the backend:

```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

3. Create or load a project.
4. Call the new endpoints:
   - `POST /agent-validation/documents/upload`
   - `POST /agent-validation/documents/index`
   - `POST /agent-validation/validate`
   - `POST /agent-validation/rewrite`

### Sample Agent Validation Requests

Document upload:

```json
{
  "project_id": "braking-system",
  "documents": [
    {
      "file_name": "brake-spec.txt",
      "content_type": "text/plain",
      "content": "The braking system shall respond within 80 ms during service braking."
    }
  ]
}
```

Requirement validation:

```json
{
  "project_id": "braking-system",
  "requirement_title": "Brake response timing",
  "requirement_text": "The braking system shall respond within 100 ms during service braking.",
  "requirement_type": "System"
}
```

Example validation response shape:

```json
{
  "status": "fail",
  "confidence": 0.84,
  "needs_escalation": true,
  "route_taken": "deep_review",
  "router_reason": "Potential contradiction against retrieved evidence.",
  "issues": [
    {
      "type": "contradiction",
      "severity": "high",
      "message": "Source document requires 80 ms, not 100 ms.",
      "evidence": [
        {
          "document_id": "doc-123",
          "chunk_id": "doc-123-chunk-1",
          "quote": "The braking system shall respond within 80 ms during service braking."
        }
      ],
      "suggested_fix": "Revise the requirement to 80 ms or justify the variance."
    }
  ],
  "rewritten_requirement": "The braking system shall respond within 80 ms during service braking.",
  "traceability_suggestions": [
    "Link this requirement to the braking performance specification."
  ]
}
```

### Where To Add Guardrails

- `backend/app/services/agent_validation/guardrails.py`
  input/output policy hooks
- `backend/app/services/agent_validation/evaluators.py`
  post-run evaluator hooks

These files are intentionally no-op today so organization-specific policy checks can be
added without changing the routing or agent wrappers.

### Lower-Cost Tuning Guidance

- keep `AGENT_TOP_K_CHUNKS` low
- reduce `AGENT_MAX_RETRIEVED_CHARS`
- keep duplicate candidate count small
- keep the escalation threshold reasonably conservative so `gpt-5.4-mini` is used only
  when the triage result warrants deeper review
- swap the in-memory vector store for FAISS or pgvector only when project scale requires it

## Testing Coverage Added In Phase 14

Backend unit tests cover:
- quality validation service
- structured parsing service
- correlation service
- feasibility service

Frontend component tests cover:
- requirement health chip
- feasibility card
- traceability view

Browser smoke tests cover:
- landing page -> braking-system demo load
- requirements navigation and weak requirement review
- structured parsing and traceability visibility
- conflict, linked engineering data, and timing feasibility checks
- validation view
- reports view with copy/export smoke coverage

## End-to-End Smoke Tests

From:
`C:\Users\shoai\OneDrive\Documents\ATLAS\requirements-intelligence-platform\frontend`

Install the browser test dependency:

```powershell
npm install
```

Install the Chromium browser once:

```powershell
npm run test:e2e:install
```

Start the full stack in another terminal from the repo root:

```powershell
docker compose up --build
```

Run the smoke suite:

```powershell
npm run test:e2e
```

Run the smoke suite in headed mode:

```powershell
npm run test:e2e:headed
```

The browser smoke tests assume:
- frontend is available at `http://127.0.0.1:3000`
- backend is available through the normal frontend API configuration
- the braking-system demo is loaded through the real landing-page UI interaction

## Demo Project

The braking-system demo can be loaded from the landing page with:
- `Load Demo Project`

The demo now seeds a real `Project` record first, then attaches demo requirements and design parameters to that persisted project.

This seeds:
- 1 braking project
- 15 requirements across requirement categories
- linked design parameters
- weak requirements for quality warnings
- conflicting requirements for correlation/conflict views
- timing data for feasibility analysis

## Pre-commit Hooks

Install the lightweight git hooks:

```powershell
.\infra\install-hooks.ps1
```

The configured pre-commit hook runs:
- frontend lint
- frontend tests
- backend ruff lint
- backend pytest suite

## Manual Verification Checklist

1. Start the full stack with `docker compose up --build`
2. Open `http://localhost:3000`
3. Sign in with `demo` / `demo1234`
4. Load the demo project from the landing page
5. Open requirement list, detail, editor, and traceability views
5. Confirm:
   - unauthenticated access redirects to the login page
   - sign out returns to the login page
   - generated draft candidates can be created from the Generate Requirements view
   - the Generate Requirements view shows provider provenance on generated candidates
   - generated candidates show quality warnings, parsed structure, and correlation hints before save
   - the Traceability Graph route shows parent-child, related, and conflict relationships with clickable requirement nodes
   - the Traceability Matrix route shows requirement relationship counts, design-link coverage, feasibility status, and row actions into detail/traceability
   - quality warnings render
   - structured parsing renders
   - conflict detection is visible
   - feasibility results include evidence and computed values
   - traceability combines the outputs into one readable view
   - the Validation route shows project-level summaries and links into affected requirements
   - the Validation route supports creating, selecting, and comparing historical validation snapshots
   - the Reports route shows a current markdown report, supports copy/export, and supports historical report snapshots
   - the browser smoke suite passes with `npm run test:e2e`

## Known Limitations

- Historical databases from earlier MVP iterations may still require the provided migrations/backfill path rather than purely fresh-schema assumptions
- Dashboard metrics are still partly static/mock rather than fully driven by persisted project data
- The braking-system demo is the main fully-seeded end-to-end flow; newly created projects start as empty workspaces
- The OpenAI-backed provider is optional and requires local API-key configuration; without it, generation uses the configured mock fallback behavior
- Rewrite/improvement suggestions are now supported on the backend provider interface and API, but they are not exposed as a dedicated frontend workflow yet
- Validation and Reports are lightweight aggregated routed views built from current outputs rather than persisted report runs
- Validation and Reports now support persisted project-level snapshots, but there is still no full requirement-by-requirement audit history or deep diff engine
- Authentication is MVP-only with owner-only access; there is no password reset, invitation flow, multi-role permissions, or external identity provider yet
- Frontend bundle size still triggers a Vite chunk-size warning
- Browser smoke coverage is intentionally small and focused on the braking-system demo journey rather than a broad E2E matrix

## Next Steps

- Add API-level tests for the new project-view aggregation endpoints
- Drive dashboard metrics from live project data instead of static summaries
- Add dedicated backend graph/matrix layout or caching support if larger projects become a priority
- Add a richer frontend rewrite/improvement workflow on top of the new provider-backed rewrite endpoint

## Generation Provider Setup

The requirement-generation workflow supports two providers:

- `mock`
  deterministic local provider, no external service required
- `openai`
  external LLM-backed provider using the OpenAI Python SDK

Provider selection:

```powershell
$env:REQUIREMENT_GENERATION_PROVIDER="mock"
```

or:

```powershell
$env:REQUIREMENT_GENERATION_PROVIDER="openai"
$env:OPENAI_API_KEY="your_api_key_here"
$env:OPENAI_MODEL="gpt-4.1-mini"
$env:REQUIREMENT_GENERATION_FALLBACK_TO_MOCK="true"
```

Optional OpenAI settings:

- `OPENAI_BASE_URL`
  override API base URL when needed
- `OPENAI_TIMEOUT_SECONDS`
  request timeout for generation calls
- `OPENAI_MAX_RETRIES`
  SDK retry count for transient provider failures

Fallback behavior:

- if `REQUIREMENT_GENERATION_PROVIDER=mock`, the app always uses the deterministic provider
- if `REQUIREMENT_GENERATION_PROVIDER=openai` and OpenAI is configured correctly, the app uses the real provider
- if `REQUIREMENT_GENERATION_PROVIDER=openai` and configuration/provider setup fails:
  - with `REQUIREMENT_GENERATION_FALLBACK_TO_MOCK=true`, the app falls back to the mock provider
  - with `REQUIREMENT_GENERATION_FALLBACK_TO_MOCK=false`, the backend returns a helpful provider error to the generation UI

Local testing instructions:

1. Start the stack with `docker compose up --build`
2. Open `http://localhost:3000`
3. Load a project or the braking-system demo
4. Open `Generate Requirements`
5. Generate candidates in `feature` mode and confirm provider provenance appears on each card
6. Switch to `decompose` mode and confirm generated child requirements still flow through validation review before save
