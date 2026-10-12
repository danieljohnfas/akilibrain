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
      AND company_name NOT ILIKE '%reputable%'
      AND company_name NOT ILIKE '%confidential%'
      AND company_name NOT ILIKE '%anonymous%'
      AND company_name NOT ILIKE '%verified employer%'
      AND company_name NOT ILIKE '%public & private%'
      AND company_name NOT ILIKE '%various verified%'
    GROUP BY company_name
    ORDER BY cnt DESC, company_name ASC
    LIMIT 90
  `;
  console.log(`Found ${rows.length} candidate companies for Batch 20:`);
  for (const r of rows) {
    console.log(`${String(r.cnt).padStart(2)} | ${r.company_name.padEnd(45)} | ${r.sample_url?.slice(0, 70)}`);
  }
  await sql.end();
}

main().catch(console.error);
