<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AkiliBrain — Coding Agent Operational Guide

This document is the authoritative contract for all AI coding agents working on this codebase.

---

## 1. Runtime & Stack Invariants

- **Framework:** Next.js 16 (App Router, React 19, Turbopack builds).
- **Request Interception:** `src/proxy.ts` (Next 16 renamed `middleware` → `proxy`; it runs on Node.js runtime).
- **Async Request APIs:** Always use async request APIs: `await cookies()`, `await headers()`, `await params`, `await searchParams`.
- **AI SDK v7:** Tools use `inputSchema` (NOT `parameters`), step limits use `stopWhen: stepCountIs(n)`, token caps use `maxOutputTokens`, file parts use `mediaType`. Call models through `src/lib/ai/router.ts` with `{ interactive: true }`.
- **Database Access:** Drizzle ORM + Supabase PostgreSQL. Modify `src/lib/db/schema/*`, then run `npx drizzle-kit generate --name=…`. Keep migrations idempotent.
- **Error Handling:** `safeQuery` swallows errors and returns `[]` — use `queryOrThrow` whenever failure must not appear as an empty result (auth guards, health checks, 404 handling).
- **Security & Data Sanitization:** Server Actions and route handlers authorize themselves. External URLs must go through `safeFetch`. Never execute model-written code. Public/AI endpoints require `enforceRateLimit`.

---

## 2. Golden Verification Commands

Run these commands before declaring any task complete:

```bash
# Typecheck
npm run typecheck

# Linting
npm run lint

# Unit & Ingestion Tests
npm test

# Comprehensive Standards Audit (when touching scrapers or DB schemas)
npm run verify:standards
```

---

## 3. Architecture & Off-Limits Zones

- **Core Schemas:** `src/lib/db/schema/` is the single source of truth for database definitions.
- **Scraper Ingestion:** `src/lib/scrapers/` must adhere to storage constraints in `scripts/apply-db-storage-constraints.mjs`.
- **Forbidden:**
  - NEVER commit `.env*` files (except `.env.example`).
  - NEVER commit raw datasets, scrape logs, or ad-hoc scripts containing hardcoded database connection strings.
  - Global pre-commit secret scanner is active; any detected credentials will abort git commits immediately.

---

## 4. 🛑 The YAGNI Rule (You Ain't Gonna Need It)

1. **No Speculative Code:** Solve only the exact user request. Do not introduce generic factory abstractions, multi-tenant helpers, or configuration options for hypothetical future needs.
2. **No Unsolicited Refactoring:** Do not touch, reformat, or "clean up" working files unrelated to the task.
3. **Zero Unnecessary Dependencies:** Do not install new npm packages if existing dependencies (`drizzle-orm`, `date-fns`, `ai`, `@supabase/supabase-js`) or standard web APIs can achieve the goal.
4. **Surgical, Minimal Diffs:** Prefer a direct 10-line fix over creating 3 new utility files. The best diff is the smallest, most verifiable one.

---

## 5. Definition of Done

Before reporting completion to the user:
- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run lint` passes with zero errors.
- [ ] `npm test` passes.
- [ ] No secrets, hardcoded passwords, or development connection URLs remain in code.
