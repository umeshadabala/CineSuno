# CineSuno — Agent Collaboration Guidelines & System Architecture

## 1. Project Overview & Stack

CineSuno is a voice-first movie-ticket-booking prototype being developed for the Bolna Symphony Buildathon.

The stack is strictly defined as follows:
- **Framework**: Next.js App Router (React, TypeScript)
- **Styling**: Tailwind CSS
- **Linting & Tooling**: ESLint, npm
- **Data Fixtures**: Local JSON files for mock catalogue data (movies, cinemas, showtimes, seat maps)
- **Backend & Logic**: Server-side TypeScript for Next.js API route handlers and booking domain logic
- **Voice Orchestration**: Bolna for voice agent integration and tool calling

**Scope Restrictions**:
No external database (e.g., Supabase, PostgreSQL, Prisma), custom external LLM hosting, Python backend, or real payment gateway integrations are permitted unless both developers explicitly agree to revise the project scope. CineSuno operates using local JSON catalogue fixtures and an in-memory server-side demo booking store.

---

## 2. Core Architecture Principles

1. **Backend is Authoritative**:
   - The backend is the single source of truth for catalogue results, seat availability, seat pricing, booking lifecycle states, and simulated payment confirmation.
   - Frontend components must interact exclusively via an API client and must never implement independent booking rules or state calculations.
2. **Unified Logic for Web and Voice**:
   - The web user interface and Bolna voice agent tool handlers MUST reuse the exact same backend business logic, validation, and booking engine services. No separate booking path for voice.
3. **Fixture Immutability**:
   - Catalogue JSON files in `data/` are read-only fixtures during runtime execution.
4. **Server-Side Mutable State**:
   - Ephemeral demo booking state (locks, held seats, confirmed bookings) resides in a server-side store (`src/lib/data-store.ts` / `src/lib/booking-state.ts`).
5. **Demo Prototype Reality**:
   - This prototype demonstrates voice-first conversational ticketing. Do not claim persistent production database storage or live cinema ticketing partner integration.

---

## 3. Mandatory Coding Rules

All agents and developers must adhere to these non-negotiable rules:

1. **Inspect Before Changing**: Always inspect the existing code, file structure, and Git status before executing edits.
2. **Minimal Bounded Changes**: Implement the smallest, cleanest change that solves the assigned task.
3. **No Unilateral Architecture Redesigns**: Never rewrite unrelated files or change system architecture independently.
4. **Preserve Teammate Work**: Never overwrite, delete, or revert another developer's work.
5. **Git Safety**: Never execute destructive Git commands (`git reset --hard`, `git clean -fd`, force pushes, etc.).
6. **Configuration & Dependency Stability**: Never modify dependencies, package scripts, configuration (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`), or shared interfaces without explicit multi-developer approval.
7. **Secret Protection**: Never expose API keys, tokens, or credentials in client bundles, public files, or commits. Keep secrets strictly in server-only environment variables (`.env.local`).
8. **Server-Side Validation**: Validate all untrusted inputs from browser clients and AI voice tools on the server before processing.
9. **Zero Blind Trust**: Do not trust prices, seat availability, or booking confirmation statuses supplied by the client browser or AI agent text. The server calculates and validates all state.
10. **Evidence-Based Completion**: Run relevant verification commands (`npm run lint`, `npx tsc --noEmit`, `npm run build`) and inspect `git diff` before declaring any task complete. Never claim a check passed without running it.

---

## 4. File Ownership Model

Two developers work on CineSuno concurrently using independent Google Antigravity AI agents on separate machines sharing one GitHub repository.

Detailed role instructions are maintained in:
- [AGENTS.frontend.md](file:///Users/umimac/Documents/GitHub/CineSuno/AGENTS.frontend.md) — **Developer A (Frontend Lead)**
- [AGENTS.backend.md](file:///Users/umimac/Documents/GitHub/CineSuno/AGENTS.backend.md) — **Developer B (Backend Lead)**

### Ownership Boundaries Summary

| Domain | Assigned Developer | Primary File Scope |
| :--- | :--- | :--- |
| **Frontend UI & Pages** | Developer A | `src/app/(customer pages)/**`, `src/components/**`, `src/lib/api-client.ts`, frontend mocks |
| **Backend & Services** | Developer B | `src/app/api/**`, `src/lib/(engine/store/pricing/validation/voice-tools).ts`, `data/**` |
| **Protected Shared Files** | Coordinated | `src/types/index.ts`, `src/app/globals.css`, `src/app/layout.tsx`, root config, agent docs |

### Key Policy: Read vs. Modify
- **Reading a file DOES NOT grant permission to modify it.** Both developers and agents are encouraged to read the full codebase for context.
- Modifying files outside an agent's assigned ownership scope is strictly forbidden.
- If an agent identifies a necessary change in a file outside its ownership, it must:
  1. Stop before touching the file.
  2. Clearly explain the rationale to the user.
  3. Propose the exact minimal diff required.
  4. Wait for explicit approval before proceeding.
- *Note*: Instruction files guide AI agents but do not represent operating-system filesystem locks. Developers must utilize Antigravity file permissions, Git diff reviews, and PR branch protections as layered defenses.

---

## 5. Protected Shared Files

The following files represent shared infrastructure and contracts:
- `src/types/index.ts` (shared API & domain type contracts)
- `src/app/globals.css` (global styles & Tailwind imports)
- `src/app/layout.tsx` (root HTML shell & global providers)
- `package.json` & `package-lock.json`
- `tsconfig.json`
- `next.config.ts`
- `eslint.config.mjs`
- `.gitignore`
- `README.md`
- `AGENTS.md`, `AGENTS.frontend.md`, `AGENTS.backend.md`
- Future API documentation (`docs/`) and CI/CD workflows (`.github/workflows/`)

### Maintenance Responsibilities
- **Developer A (Frontend)** is the initial maintainer of the application shell (`src/app/layout.tsx`), shared styling (`src/app/globals.css`), and project build/lint configuration.
- **Developer B (Backend)** is the initial maintainer of backend services, fixtures, and API endpoints.
- Any change to protected shared files requires explicit mutual agreement between Developer A and Developer B before implementation. Changes to `AGENTS.md` rules require coordination between both developers.

---

## 6. Collaboration Workflow

All development follows this sequential lifecycle:

1. **Synchronize**: Pull the latest changes from the agreed integration branch.
2. **Branch**: Create a focused feature branch off `develop` (once `develop` is created; until then, coordinate on the active branch).
3. **Read Instructions**: Review `AGENTS.md` and the relevant role file (`AGENTS.frontend.md` or `AGENTS.backend.md`).
4. **Implement Focused Task**: Complete one bounded, well-defined task at a time within your assigned file scope.
5. **Verify Locally**: Execute verification checks:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run build`
6. **Review Diff**: Run `git diff` and `git status --short` to ensure no out-of-scope or generated secret files were touched.
7. **Scope Verification**: Confirm every changed file is strictly within assigned ownership or pre-approved.
8. **Commit & Push**: Commit with clear conventional commit messages and push only when explicitly authorized by the developer.
9. **Pull Request**: Open a PR targeting `develop`.
10. **Peer Review**: Review code diffs and CI checks before merging.
11. **Post-Merge Verification**: Test the integrated application after merging to maintain trunk health.

---

## 7. Mandatory Task Completion Report

Every task completed by an AI coding agent must conclude with a structured report containing:

1. **Task Completed**: Concise title and description of the completed task.
2. **Files Created or Modified**: Exact list of touched files with clickable links.
3. **Summary of Changes**: Bullet points explaining what was changed and why.
4. **Commands and Tests Run**: Exact verification commands run in the terminal.
5. **Results & Unresolved Issues**: Actual execution results (exit codes, pass/fail status) and any remaining blockers.
6. **Scope Compliance**: Explicit confirmation that all changes remained within the developer's assigned scope (or details of pre-approved exceptions).
7. **Handoff & Dependencies**: Clear notes on data contracts, endpoints, or decisions needed from or provided to the other developer.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
