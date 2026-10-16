# AkiliBrain Data Standards & Ingestion Architecture

This document defines the mandatory **Data Scraping, Ingestion, and Storage Standards** for AkiliBrain (`akilibrain.com`), enforced across three independent layers:
1. **Write-Time Ingestion Layer:** [`src/lib/scrapers/ingestion-standards.ts`](../src/lib/scrapers/ingestion-standards.ts), [`src/lib/services/database-data-reviewer.ts`](../src/lib/services/database-data-reviewer.ts), and [`src/lib/salaries/verify-plausibility.ts`](../src/lib/salaries/verify-plausibility.ts)
2. **PostgreSQL Storage & Drizzle Schema Layer:** [`src/lib/db/schema/`](../src/lib/db/schema/) + [`scripts/apply-db-storage-constraints.mjs`](../scripts/apply-db-storage-constraints.mjs) (`16` active PostgreSQL `CHECK` constraints)
3. **CI / Audit Verification Layer:** [`scripts/verify-all-data-standards.mjs`](../scripts/verify-all-data-standards.mjs) and [`src/lib/scrapers/__tests__/ingestion-standards.test.ts`](../src/lib/scrapers/__tests__/ingestion-standards.test.ts)

---

## 1. Module-Specific Data Standards

### 1.1 `jobs` ([`src/lib/db/schema/jobs.ts`](../src/lib/db/schema/jobs.ts))
- **Geographic Attribution:** Non-African jobs (US states, UK, EU, Canada) must be rejected before fallback country assignment via `isForeignMisattribution(...)` in [`country-resolver.ts`](../src/lib/scrapers/ats-handlers/country-resolver.ts) and [`ingestion-standards.ts`](../src/lib/scrapers/ingestion-standards.ts).
- **Employer Name (`company_name`):** Must never be a raw placeholder (`Company Name`, `Anonymous Employer`, `Confidential`, `Unknown`, `N/A`, `Undisclosed`, `Client`). Must be extracted from job title/description or standardized to `<Country> <Sector> Hiring Partner`. Enforced by PostgreSQL constraint `jobs_company_name_valid_chk`.
- **Classification Completeness:** `sector`, `experience_level`, and `education_level` must be non-null and non-empty (`jobs_sector_not_empty_chk`, `jobs_experience_level_not_empty_chk`, `jobs_education_level_not_empty_chk`). Senior/Director/Head titles must never be tagged `entry_level` or `internship`.
- **Content Depth:**
  - `description` must be stripped of scraper UI chrome (`Posted X ago`, `Easy Apply`) and be **`>= 100` characters** (`jobs_description_min_length_chk`).
  - `requirements` must be structured and **`>= 80` characters** (`jobs_requirements_min_length_chk`).
  - `skills` must contain at least 1 relevant professional skill.

### 1.2 `tenders` ([`src/lib/db/schema/tenders.ts`](../src/lib/db/schema/tenders.ts))
- **Contracting Authority (`contracting_authority`):** Must be a valid procuring entity name (`>= 3` chars) and never a sentence fragment (`the`, `to`, `by`, `a`, `under`) or generic placeholder (`Procuring Entity`, `South Sudan Contracting Authority`, `Unknown`). Enforced by `tenders_contracting_authority_valid_chk`.
- **Required Enrichment Fields:** Every tender must be stored with:
  - `ai_summary` (`>= 20` chars structured JSON summary; `tenders_ai_summary_not_empty_chk`)
  - `sector_id` (`NOT NULL`; `tenders_sector_id_not_null_chk`)
  - `employer_url` (`NOT NULL`; `tenders_employer_url_not_empty_chk`)
  - `status` (`open` only when `deadline IS NULL OR deadline > NOW()`, otherwise `closed`).

### 1.3 `compliance_requirements` ([`src/lib/db/schema/compliance.ts`](../src/lib/db/schema/compliance.ts))
- **Title Hygiene:** Titles must never start with `[LINK]` or raw `http(s)://` URLs.
- **Issuing Authority (`issuing_authority`):** Must identify a specific national regulator (e.g., `KRA / BRS`, `URSB / URA`, `BRELA / TRA`, `RDB`, `PACRA`) and never be generic (`Regulatory Authority`, `Relevant Regulatory Authority`, `Unknown`, `Various`). Enforced by `compliance_issuing_authority_valid_chk`.
- **Completeness:** Every row must have non-empty `required_documents`, `renewal_period_days` (`compliance_renewal_period_not_empty_chk`), `estimated_cost` (`compliance_estimated_cost_not_empty_chk`), and `last_verified_at` (`compliance_last_verified_not_null_chk`).

### 1.4 `salary_submissions` ([`src/lib/db/schema/salaries.ts`](../src/lib/db/schema/salaries.ts))
- **Deterministic Currency & Floor Validation:** Before any salary is marked `is_verified = true` (in either `/api/salaries/submit` or `scrape-salaries.ts`), [`checkSalaryPlausibility`](../src/lib/salaries/verify-plausibility.ts) validates:
  - `COUNTRY_ALLOWED_CURRENCIES`: Only the country's local ISO currency or `USD`/`EUR`/`GBP` is eligible for `is_verified = true`.
  - `CURRENCY_MONTHLY_BOUNDS`: Gross monthly salary must fall within realistic currency-specific monthly bounds (e.g., `KES 8,000–5,000,000`, `UGX 150,000–50,000,000`, `TZS 100,000–40,000,000`, `USD 80–40,000`).

### 1.5 `health_indicators`, `health_data_points` & `user_documents`
- **`health_indicators`:** Must only be inserted *after* validating at least one data point with a valid numeric `value` and `year` (`1980..2035`, `health_data_points_year_valid_chk`), and `unit` must be non-empty (`health_indicators_unit_not_empty_chk`).
- **`user_documents`:** Every uploaded document in `/api/upload-cv` must populate a non-empty `summary` (`user_documents_summary_not_empty_chk`).

---

## 2. Verification & Enforcement Commands

```bash
# 1. Run unit tests for scraping & ingestion standards
npm test -- src/lib/scrapers/__tests__/ingestion-standards.test.ts

# 2. Apply/verify all 16 PostgreSQL storage-level CHECK constraints
npm run enforce:constraints

# 3. Run full live database audit across all tables (exits 1 on any violation)
npm run audit:data

# 4. Run full end-to-end standards suite (typecheck + unit tests + live DB audit)
npm run verify:standards
```
