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
  `;
  console.log(`Found ${rows.length} rows with generic/verified employer labels.`);
  
  let extractableCount = 0;
  let roundupCount = 0;
  
  for (const r of rows) {
    const url = r.source_url || '';
    const slug = url.replace(/\/$/, '').split('/').pop() || '';
    
    // Check if it has '-at-' or mentions a specific employer
    const isRoundup = /recommended-jobs|available-slots|various|exciting.*vacancies/i.test(slug);
    if (isRoundup) {
      roundupCount++;
    } else {
      extractableCount++;
      console.log(`Extractable: [${r.title}] -> slug: ${slug}`);
    }
  }
  console.log(`\nSummary: Extractable single-employer: ${extractableCount}, Roundup listings: ${roundupCount}`);
  await sql.end();
}
run().catch(console.error);
