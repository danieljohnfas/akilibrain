import { createRequire } from 'module';
import { join } from 'path';
import fs from 'fs';

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
  const [totals] = await sql`
    SELECT 
      COUNT(*) as total, 
      COUNT(employer_url) as with_url, 
      COUNT(*) FILTER (WHERE employer_url IS NULL) as without_url 
    FROM jobs 
    WHERE is_active = true
  `;
  console.log('TOTAL ACTIVE JOBS:', totals.total);
  console.log('WITH EMPLOYER_URL:', totals.with_url, `(${(totals.with_url / totals.total * 100).toFixed(2)}%)`);
  console.log('WITHOUT EMPLOYER_URL:', totals.without_url);

  const rows = await sql`
    SELECT company_name, COUNT(*) as cnt, MIN(source_url) as sample_url
    FROM jobs 
    WHERE is_active = true AND employer_url IS NULL 
    GROUP BY company_name 
    ORDER BY cnt DESC, company_name ASC
  `;
  console.log('DISTINCT COMPANIES MISSING URL:', rows.length);
  fs.writeFileSync('scripts/unresolved-companies.json', JSON.stringify(rows, null, 2));
  console.log('Wrote unresolved companies to scripts/unresolved-companies.json');
  await sql.end();
}
run().catch(console.error);
