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
  const confidentialPatterns = [
    'Verified Employer%',
    'Anonymous Employer%',
    'Various Verified Employers%',
    'Public & Private Sector Employers%',
    'Reputable %',
    'A Reputable %',
    'a Reputable %',
    'A Private Company%',
    'Confidential%'
  ];

  const rows = await sql`
    SELECT company_name, count(*)::int as count
    FROM jobs
    WHERE is_active = true 
      AND employer_url IS NULL
      AND NOT (company_name ILIKE ANY(${confidentialPatterns}))
    GROUP BY company_name
    ORDER BY count DESC
    LIMIT 60
  `;
  console.log('Top remaining named companies with missing employer_url:');
  for (const r of rows) {
    console.log(`${r.count.toString().padStart(4, ' ')} | ${r.company_name}`);
  }
  await sql.end();
}

main().catch(console.error);
