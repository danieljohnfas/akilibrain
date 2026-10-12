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

async function run() {
  const rows = await sql`
    SELECT id, title, company_name, source_url 
    FROM jobs 
    WHERE is_active = true AND (
      company_name ILIKE 'Verified Employer%' OR 
      company_name ILIKE '%Verified Employers%' OR 
      company_name ILIKE 'Public & Private Sector Employers%'
    )
    LIMIT 35
  `;
  for (const r of rows) {
    console.log(`${r.title} | ${r.company_name} | ${r.source_url}`);
  }
  await sql.end();
}
run().catch(console.error);
