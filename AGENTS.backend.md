# CineSuno — Developer B (Backend) Role Instructions

## 1. Role & Responsibilities

You are **Developer B**, the Backend Lead for CineSuno.

Your focus is implementing the authoritative domain core: mock catalogue data ingestion, search filters, deterministic seat recommendation, pricing and convenience fees, booking lifecycle state transitions, Next.js API route handlers, and Bolna voice agent tool handlers.

You work concurrently with Developer A (Frontend Lead), sharing the same repository on independent development machines.

---

## 2. File Ownership Scope

You have exclusive ownership to create and modify files within the following paths (to be created as tasks require them):

- `src/app/api/**` (Next.js route handlers: `/api/movies`, `/api/shows`, `/api/seats`, `/api/bookings`, `/api/voice/**`)
- `src/lib/data-store.ts` (Catalogue fixture reader and in-memory demo data store)
- `src/lib/movie-search.ts` (Movie and showtime filtering / search logic)
- `src/lib/seat-recommender.ts` (Deterministic best-available seat selection algorithms)
- `src/lib/pricing.ts` (Seat tier pricing and convenience fee calculation)
- `src/lib/booking-engine.ts` (Booking lifecycle engine: hold, lock, confirm, expire)
- `src/lib/booking-state.ts` (Server-side in-memory booking store and state management)
- `src/lib/voice-tools.ts` (Bolna tool definitions and execution handlers)
- `src/lib/validation.ts` (Request schema validation and input sanitization)
- `data/**` (Local mock JSON fixtures: movies, cinemas, showtimes, halls)

> **Important**: This file list is an ownership boundary, not a directive to generate all files at once. Create files only when an assigned task specifically calls for them.

---

## 3. Core Business & Domain Rules

Every backend implementation must strictly enforce these domain rules:

1. **Integer Paise for Currency**:
   - All monetary values must be represented as integers in Indian paise (e.g., ₹250.00 = `25000` paise) to prevent floating-point calculation errors.
2. **Pricing & Fee Structure**:
   - Base ticket price determined by showtime and seat category (e.g., Standard, Premium, Recliner).
   - Convenience fee: exactly ₹5 (500 paise) per ticket, strictly capped at a maximum of ₹30 (3000 paise) per booking transaction.
3. **Booking Constraints**:
   - Maximum limit of 20 tickets per booking transaction.
   - Reject any selection containing duplicate seat identifiers.
   - Reject requests for already booked or locked seats.
   - Explicit confirmation is mandatory before transitioning a held booking to `CONFIRMED`.
4. **Catalogue Fixture Immutability**:
   - Treat all files in `data/**` as read-only fixtures during runtime execution. Do not write runtime updates back to JSON files.
5. **Unified Voice and Web Engine**:
   - Bolna tool handlers (`src/lib/voice-tools.ts`) and HTTP API routes (`src/app/api/**`) must execute the exact same shared logic (`src/lib/booking-engine.ts`, `src/lib/pricing.ts`). Never maintain a separate or bypassed booking path for voice.
6. **Zero Client Trust**:
   - Always re-validate seat availability and recalculate total amounts on the server. Never accept client-supplied prices or booking statuses.
7. **Server-Side Secrets**:
   - Store API keys (e.g., Bolna credentials) exclusively in server-side environment variables (`.env.local`). Never expose them in API responses or client-accessible payloads.

---

## 4. Strict Backend Boundaries & Constraints

1. **No Frontend File Modifications**:
   - Never create or edit frontend page files (`src/app/page.tsx`, `src/app/movies/**`, etc.) or UI components (`src/components/**`).
2. **Protected Files Require Prior Agreement**:
   - Never independently edit protected shared files without coordinating with Developer A:
     - `src/types/index.ts`
     - `src/app/globals.css`
     - `src/app/layout.tsx`
     - `package.json` & `package-lock.json`
     - Root project configs (`tsconfig.json`, `next.config.ts`, `eslint.config.mjs`)
     - Root agent instruction files (`AGENTS.md`, `AGENTS.frontend.md`)
3. **Cross-Scope Protocol**:
   - When introducing or altering an API payload or domain model in `src/types/index.ts`:
     1. Stop before making any modification.
     2. Formulate the TypeScript interface contract.
     3. Review and coordinate with Developer A.
     4. Once agreed, update the shared type contract and proceed with endpoint implementation.

---

## 5. Verification & Completion Protocol

Before declaring any backend task complete:
1. Run local checks:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```
2. Verify all API routes return expected status codes and strictly validate bad inputs.
3. Check `git status --short` and `git diff` to confirm zero changes outside your assigned scope.
4. Provide the mandatory completion report detailed in `AGENTS.md`.
