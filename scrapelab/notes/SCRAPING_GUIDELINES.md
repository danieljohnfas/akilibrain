# Web Scraping & Data Sourcing Guidelines

This document outlines best practices and lessons learned for web scraping and data aggregation.
These guidelines are derived from hands-on findings during large-scale data rescraping efforts on the Akilibrain project.

---

## 1. Use `--env-file` at the CLI, Never `dotenv.config()` Inside Scripts

When writing scripts that use module-level DB clients (e.g., Drizzle, Prisma, TypeORM), **never** rely on `dotenv.config()` inside the script file. In ESM/TypeScript, `import` statements are hoisted and execute before any runtime code, meaning the DB client is initialized with an empty `DATABASE_URL` before `dotenv.config()` ever runs.

- ✅ **Correct**: `npx tsx --env-file=.env.local scripts/my-script.ts`
- ❌ **Wrong**: `import { config } from 'dotenv'; config({ path: '.env.local' }); import { db } from './client';`

---

## 2. Prioritize Official APIs over Web Scraping

Web scraping should be a last resort. HTML structures change frequently, leading to brittle scrapers.

- Always search for official APIs, open data portals, or GraphQL endpoints first.
- **Example:** Use the World Bank Open Data API or the WHO Global Health Observatory for health statistics — the World Bank returned data for every indicator reliably, while WHO GHO endpoint codes became stale and returned 404s.
- If using WHO GHO: validate endpoint codes before every run, as they change without notice.

---

## 3. Leverage AI-Driven Broad Search for Fragmented Data

When data is highly fragmented (e.g., regional salary benchmarks), a dynamic pipeline beats a static URL list.

**Pipeline:** Programmatic Search (Serper/Google) → URL Discovery → Content Fetch → LLM Extraction

- **Remove DuckDuckGo (DDGS) from the search chain.** It timed out on every single request across 6 countries in testing. Serper is the reliable provider.
- **Raise the `maxUrls` cap.** A cap of 3 URLs per country is too conservative — a single good source (e.g., `nafasi.io`) can yield 40+ records. Set it to 5–6 minimum.
- **Try plain HTTP first, Sidecar proxy last.** The Sidecar proxy failed on 100% of requests (timeout), and plain HTTP successfully fetched all pages. Trying Sidecar first wastes time.

---

## 4. Strictly Normalize LLM Output Before Database Insertion

LLMs extract data faithfully but their output types often violate strict DB schemas.

- Always validate and coerce types before insertion. Never pass raw LLM output directly to a DB query.
- **Integer columns**: Use `Math.round()` or `parseInt()` for fields like `yearsOfExperience`. LLMs extract ranges like "1–2 years" as midpoints (e.g., `1.5`), causing Postgres `22P02` errors.
- **Fix the extraction prompt too**: Tell the LLM to "always return whole numbers for years" — fix the source, not just the sanitization layer.
- **Hot-fixing a running script has no effect** on already-in-flight records. Apply fixes before running; they only take effect on the next fresh run.

---

## 5. Distinguish Silent Zero-Inserts from Genuine Success

A log line like `✅ Inserted 0 new salary records` should be treated as a **warning**, not success. There are two very different causes:

1. **Legitimate**: All extracted records were already present in the DB (true duplicates).
2. **Silent failure**: FK lookups for `job_category_id` or `employer_id` returned `null` for unrecognized titles (especially non-English sources), causing rows to be silently dropped.

- Add explicit logging to distinguish these cases: `"0 inserted: N duplicates skipped, M failed FK mapping"`.
- Pay special attention to **multilingual sources** (e.g., French-language African salary sites). AI extracts the data correctly but the downstream category mapping may not handle non-English job titles.

---

## 6. Build for High Fault Tolerance and Resilience

Scraping at scale will encounter timeouts, `403` errors, and LLM failures.

- Catch **individual record insertion errors** so one bad row doesn't abort the entire batch.
- Have LLM failover ready: if Mistral times out, fall back to Gemini (and vice versa).
- For sites like Glassdoor, expect persistent `403` errors — exclude them from URL candidates automatically.

---

## 7. Always Track Data Provenance (`source_url`)

- Include a `source_url` (and `scraped_at` timestamp) in the DB schema for all aggregated data.
- This allows future scripts to re-visit the exact source to check for updates.
- This also allows human reviewers to verify data accuracy without having to re-run the pipeline.

---

## 8. Data Yield Is Uneven — Monitor Per-Source Contribution

One high-quality URL can yield far more records than several poor ones. After a run, log how many records each URL contributed. Use this to build a curated allowlist of high-yield sources per country/domain, and deprioritize or blocklist low-yield or blocked sources (e.g., YouTube, TikTok, Glassdoor).
