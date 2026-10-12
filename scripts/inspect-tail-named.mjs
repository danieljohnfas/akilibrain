import { createRequire } from 'module';
import { join } from 'path';

const projectRoot = process.cwd(); // run from the repo root
const require = createRequire(join(projectRoot, 'package.json'));
const dotenv = require('dotenv');
dotenv.config({ path: join(projectRoot, '.env.local') });

const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
});

async function main() {
  const rows = await sql`
    SELECT company_name, COUNT(*) as cnt, MIN(source_url) as sample_url
    FROM jobs
    WHERE is_active = true 
      AND employer_url IS NULL
      AND (
        company_name ILIKE '%Bank%' OR
        company_name ILIKE '%Hospital%' OR
        company_name ILIKE '%University%' OR
        company_name ILIKE '%College%' OR
        company_name ILIKE '%School%' OR
        company_name ILIKE '%Institute%' OR
        company_name ILIKE '%Ministry%' OR
        company_name ILIKE '%Embassy%' OR
        company_name ILIKE '%Foundation%' OR
        company_name ILIKE '%Council%' OR
        company_name ILIKE '%PLC%' OR
        company_name ILIKE '%Ltd%' OR
        company_name ILIKE '%Limited%'
      )
      AND company_name NOT ILIKE '%reputable%'
      AND company_name NOT ILIKE '%confidential%'
      AND company_name NOT ILIKE '%anonymous%'
    GROUP BY company_name
    ORDER BY cnt DESC, company_name ASC
  `;
  console.log(`Found ${rows.length} institutional companies in tail:`);
  for (const r of rows.slice(0, 50)) {
    console.log(`  ${String(r.cnt).padStart(2)} | ${r.company_name.padEnd(45)} | ${r.sample_url?.slice(0, 60)}`);
  }
  await sql.end();
}

main().catch(console.error);
