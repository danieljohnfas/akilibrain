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
  const jobs = await sql`
    SELECT id, title, company_name, employer_url, is_aggregator_source, source_url
    FROM jobs
    WHERE is_active = true
      AND (
        employer_url IS NULL 
        OR employer_url = '' 
        OR is_aggregator_source = true
      )
  `;

  console.log(`Total matching: ${jobs.length}`);
  const byCompany = {};
  for (const j of jobs) {
    const c = j.company_name || 'Unknown';
    if (!byCompany[c]) byCompany[c] = [];
    byCompany[c].push(j);
  }

  const sorted = Object.entries(byCompany).sort((a,b) => b[1].length - a[1].length);
  console.log(`Unique companies/groups: ${sorted.length}`);
  sorted.forEach(([c, list]) => {
    console.log(`${c} (${list.length}): "${list[0].title}" | is_agg: ${list[0].is_aggregator_source} | employer_url: ${list[0].employer_url || 'NONE'} | source: ${list[0].source_url?.substring(0, 50)}...`);
  });
  await sql.end();
}

main().catch(console.error);
