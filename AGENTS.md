# Project: Requirements Intelligence Platform

Build a desktop-first engineering application for AI-assisted requirements engineering.

Primary goals:
- Manage projects and requirements
- Detect requirement ambiguity and inconsistency
- Correlate requirements with linked design parameters
- Run deterministic feasibility checks
- Show traceable evidence for every warning

Preferred stack:
- Frontend: React + TypeScript + MUI
- Backend: FastAPI + Python
- Database: PostgreSQL
- Docker Compose for local development

Engineering rules:
- Build incrementally
- Keep code modular and typed
- Do not overengineer early phases
- Prefer deterministic logic for MVP over AI calls
- After each task:
  1. summarize what changed
  2. list exact files created/modified
  3. list how to run and test the change
  4. list known gaps

Quality rules:
- Backend: routers, schemas, services, models separation
- Frontend: reusable components, typed API client, clean routing
- Add loading, empty, and error states
- Keep UI enterprise-style, not marketing-style

Testing rules:
- Add tests for important logic as features stabilize
- Never mark a task complete without local verification steps

Universal prompt rules for Codex:
- Work narrowly.
- Do not redesign unrelated parts of the codebase.
- Do not add extra libraries unless required.
- Prefer simple production-sensible implementation.
- Keep changes minimal but complete for this phase only.
- Follow AGENTS.md exactly.
- At the end return:
  1. summary of changes
  2. files changed
  3. run steps
  4. test steps
  5. known gaps
