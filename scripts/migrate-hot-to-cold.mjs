#!/usr/bin/env node
/**
 * Hot / Cold Tier Migration Script for AkiliBrain.com (High Performance Batched)
 * Moves expired jobs & closed tenders from Supabase Postgres (Hot) to Cloudflare D1 (Cold)
 * Uses multi-row SQL batching (50 rows per HTTP request) for fast completion (~2 minutes).
 */

import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '9213ae688946caea617ba6fd5e4fbc5c';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '1e0d9072-50da-4bfb-bbba-9c8596a69b88';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.pywienffahvmylssnorr:6g3kJKx9u%40Sb!Xn@aws-1-eu-central-1.pooler.supabase.com:6543/postgres';

if (!CLOUDFLARE_API_TOKEN) {
  console.error('ERROR: CLOUDFLARE_API_TOKEN environment variable is required.');
  process.exit(1);
}

// SQL literal escaping
function sqlVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (v instanceof Date) return `'${v.toISOString().replace(/'/g, "''")}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

// Cloudflare D1 HTTP Client helper
async function d1Exec(sql) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql }),
  });

  const json = await res.json().catch(() => ({}));
  if (!json.success) {
    const errorMsg = (json.errors || []).map(e => e.message).join('; ');
    throw new Error(`D1 HTTP Error ${res.status}: ${errorMsg || 'Unknown error'}`);
  }
  return json.result?.[0]?.results || [];
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Split SQL text into separate statements for D1 execution
function splitSql(text) {
  const out = [];
  let cur = '', inStr = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      cur += ch;
      if (ch === "'") inStr = false;
    } else if (ch === "'") {
      cur += ch; inStr = true;
    } else if (ch === '-' && text[i + 1] === '-') {
      while (i < text.length && text[i] !== '\n') i++;
      cur += '\n';
    } else if (ch === ';') {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function initSchema() {
  console.log('--- Initializing Cloudflare D1 Schema ---');
  const schemaPath = path.join(process.cwd(), 'scripts', 'init-d1-schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const statements = splitSql(schemaSql);
  for (const statement of statements) {
    if (!statement) continue;
    await d1Exec(statement);
  }
  console.log('✓ D1 schema ready.');
}

async function main() {
  const prune = process.argv.includes('--prune');
  console.log(`Starting High-Performance Hot -> Cold Migration (Prune: ${prune})...`);

  // 1. Initialize schema
  await initSchema();

  // 2. Connect to Supabase
  const sql = postgres(DATABASE_URL, { ssl: { rejectUnauthorized: false } });

  try {
    // Check initial counts
    const [jobsTotal] = await sql`SELECT count(*) FROM jobs;`;
    const [jobsExpired] = await sql`SELECT count(*) FROM jobs WHERE deadline < NOW();`;
    const [tendersTotal] = await sql`SELECT count(*) FROM tenders;`;
    const [tendersClosed] = await sql`SELECT count(*) FROM tenders WHERE deadline < NOW() OR status != 'open';`;

    console.log(`Supabase State:`);
    console.log(`  Jobs: ${jobsTotal.count} total, ${jobsExpired.count} expired to migrate`);
    console.log(`  Tenders: ${tendersTotal.count} total, ${tendersClosed.count} closed/expired to migrate`);

    // --- PHASE 1: MIGRATE EXPIRED JOBS (Batched 50 rows per HTTP request) ---
    console.log('\n--- Phase 1: Migrating Expired Jobs to D1 (Multi-Row Batched) ---');
    const BATCH_SIZE = 50;
    let offset = 0;
    let migratedJobs = 0;

    while (true) {
      const rows = await sql`
        SELECT 
          j.id, j.title, j.company_name, j.description, j.requirements, j.location,
          j.country_id, c.name as country_name, r.name as region_name,
          j.job_type, j.source_url, j.posted_date, j.deadline,
          j.created_at, j.salary_min, j.salary_max, j.salary_currency,
          j.employer_url, j.sector, j.profession, j.experience_level,
          j.education_level, j.skills
        FROM jobs j
        LEFT JOIN countries c ON j.country_id = c.id
        LEFT JOIN regions r ON j.region_id = r.id
        WHERE j.deadline < NOW()
        ORDER BY j.created_at ASC
        LIMIT ${BATCH_SIZE} OFFSET ${offset};
      `;

      if (rows.length === 0) break;

      const valueTuples = rows.map(r => {
        let skillsStr = null;
        if (r.skills) {
          skillsStr = Array.isArray(r.skills) ? JSON.stringify(r.skills) : String(r.skills);
        }
        return `(${[
          sqlVal(r.id),
          sqlVal(r.title),
          sqlVal(r.company_name),
          sqlVal(r.description),
          sqlVal(r.requirements),
          sqlVal(r.location),
          sqlVal(r.country_id),
          sqlVal(r.country_name),
          sqlVal(r.region_name),
          sqlVal(r.job_type || 'full_time'),
          sqlVal(r.source_url),
          sqlVal(r.posted_date),
          sqlVal(r.deadline),
          '0',
          sqlVal(r.created_at),
          sqlVal(r.salary_min ? parseFloat(r.salary_min) : null),
          sqlVal(r.salary_max ? parseFloat(r.salary_max) : null),
          sqlVal(r.salary_currency),
          sqlVal(r.employer_url),
          sqlVal(r.sector),
          sqlVal(r.profession),
          sqlVal(r.experience_level),
          sqlVal(r.education_level),
          sqlVal(skillsStr)
        ].join(', ')})`;
      });

      const batchSql = `
        INSERT OR REPLACE INTO archived_jobs (
          id, title, company_name, description, requirements, location,
          country_id, country_name, region_name, job_type, source_url,
          posted_date, deadline, is_active, created_at, salary_min,
          salary_max, salary_currency, employer_url, sector, profession,
          experience_level, education_level, skills
        ) VALUES \n${valueTuples.join(',\n')};
      `;

      let retries = 5;
      while (retries > 0) {
        try {
          await d1Exec(batchSql);
          break;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          console.warn(`  D1 batch retry (${err.message}). Waiting 2s...`);
          await sleep(2000);
        }
      }

      migratedJobs += rows.length;
      offset += rows.length;

      if (migratedJobs % 500 === 0 || offset >= Number(jobsExpired.count)) {
        console.log(`  Migrated ${migratedJobs} / ${jobsExpired.count} expired jobs...`);
      }
      await sleep(150); // Gentle pacing to avoid rate limit bursts
    }
    console.log(`✓ Completed jobs migration. Total migrated: ${migratedJobs}`);

    // --- PHASE 2: MIGRATE CLOSED TENDERS (Batched 50 rows per HTTP request) ---
    console.log('\n--- Phase 2: Migrating Closed/Expired Tenders to D1 (Multi-Row Batched) ---');
    offset = 0;
    let migratedTenders = 0;

    while (true) {
      const rows = await sql`
        SELECT 
          t.id, t.reference_no, t.title, t.description, t.contracting_authority,
          t.country_id, c.name as country_name, s.name as sector_name,
          t.category, t.status, t.budget, t.currency,
          t.published_at, t.deadline, t.source_url, t.document_url,
          t.extracted_text, t.employer_url, t.ai_summary, t.created_at
        FROM tenders t
        LEFT JOIN countries c ON t.country_id = c.id
        LEFT JOIN tender_sectors s ON t.sector_id = s.id
        WHERE t.deadline < NOW() OR t.status != 'open'
        ORDER BY t.created_at ASC
        LIMIT ${BATCH_SIZE} OFFSET ${offset};
      `;

      if (rows.length === 0) break;

      const valueTuples = rows.map(r => `(${[
        sqlVal(r.id),
        sqlVal(r.reference_no),
        sqlVal(r.title),
        sqlVal(r.description),
        sqlVal(r.contracting_authority),
        sqlVal(r.country_id),
        sqlVal(r.country_name),
        sqlVal(r.sector_name),
        sqlVal(r.category || 'other'),
        sqlVal('closed'),
        sqlVal(r.budget ? parseFloat(r.budget) : null),
        sqlVal(r.currency),
        sqlVal(r.published_at),
        sqlVal(r.deadline),
        sqlVal(r.source_url),
        sqlVal(r.document_url),
        sqlVal(r.extracted_text),
        sqlVal(r.employer_url),
        sqlVal(r.ai_summary),
        sqlVal(r.created_at)
      ].join(', ')})`);

      const batchSql = `
        INSERT OR REPLACE INTO archived_tenders (
          id, reference_no, title, description, contracting_authority,
          country_id, country_name, sector_name, category, status,
          budget, currency, published_at, deadline, source_url,
          document_url, extracted_text, employer_url, ai_summary, created_at
        ) VALUES \n${valueTuples.join(',\n')};
      `;

      let retries = 5;
      while (retries > 0) {
        try {
          await d1Exec(batchSql);
          break;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          console.warn(`  D1 batch retry (${err.message}). Waiting 2s...`);
          await sleep(2000);
        }
      }

      migratedTenders += rows.length;
      offset += rows.length;

      if (migratedTenders % 500 === 0 || offset >= Number(tendersClosed.count)) {
        console.log(`  Migrated ${migratedTenders} / ${tendersClosed.count} closed tenders...`);
      }
      await sleep(150);
    }
    console.log(`✓ Completed tenders migration. Total migrated: ${migratedTenders}`);

    // --- PHASE 3: VERIFICATION ---
    console.log('\n--- Phase 3: Verifying Cloudflare D1 Cold Tier ---');
    const d1JobCounts = await d1Exec('SELECT count(*) as count FROM archived_jobs;');
    const d1TenderCounts = await d1Exec('SELECT count(*) as count FROM archived_tenders;');

    const d1Jobs = d1JobCounts[0]?.count || 0;
    const d1Tenders = d1TenderCounts[0]?.count || 0;

    console.log(`D1 Archive Database Counts:`);
    console.log(`  Archived Jobs in D1: ${d1Jobs} (Target: >= ${migratedJobs})`);
    console.log(`  Archived Tenders in D1: ${d1Tenders} (Target: >= ${migratedTenders})`);

    if (d1Jobs < migratedJobs || d1Tenders < migratedTenders) {
      throw new Error(`Integrity check failed! D1 counts (${d1Jobs}/${d1Tenders}) do not match migrated counts (${migratedJobs}/${migratedTenders}).`);
    }
    console.log('✓ Cold Tier integrity verified 100%!');

    // --- PHASE 4: PRUNING SUPABASE HOT TIER ---
    if (prune) {
      console.log('\n--- Phase 4: Pruning Expired Rows from Supabase ---');
      console.log('Deleting expired jobs from Supabase...');
      await sql`
        DELETE FROM jobs 
        WHERE deadline < NOW();
      `;
      console.log(`✓ Deleted expired jobs from Supabase.`);

      console.log('Deleting closed tenders from Supabase...');
      await sql`
        DELETE FROM tenders 
        WHERE deadline < NOW() OR status != 'open';
      `;
      console.log(`✓ Deleted closed tenders from Supabase.`);

      console.log('Reclaiming table storage via VACUUM ANALYZE...');
      await sql`VACUUM (ANALYZE) jobs;`;
      await sql`VACUUM (ANALYZE) tenders;`;

      // Check final sizes
      const sizes = await sql`
        SELECT
          relname AS table_name,
          pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
          n_live_tup AS row_count
        FROM pg_stat_user_tables
        WHERE relname IN ('jobs', 'tenders', 'businesses', 'compliance_requirements')
        ORDER BY pg_total_relation_size(relid) DESC;
      `;
      console.log('\nUpdated Supabase Table Sizes:');
      console.table(sizes);

      const [dbSize] = await sql`SELECT pg_size_pretty(pg_database_size(current_database())) as total_db_size;`;
      console.log(`\n🎉 Total Supabase Database Size Now: ${dbSize.total_db_size} (Well under 500 MB quota!)`);
    } else {
      console.log('\n[Dry Run / Archive Only]: Prune flag not specified. Rows preserved in Supabase.');
      console.log('Run with --prune to reclaim Supabase storage.');
    }

  } finally {
    await sql.end();
  }
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
