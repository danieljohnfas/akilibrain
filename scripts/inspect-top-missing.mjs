import { createRequire } from 'module';
import { join } from 'path';

const projectRoot = 'c:/Users/nnm/Documents/projects/akilihub';
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
    SELECT company_name, count(*)::int as count
    FROM jobs
    WHERE is_active = true AND employer_url IS NULL
    GROUP BY company_name
    HAVING count(*) >= 2
    ORDER BY count DESC
    OFFSET 30
    LIMIT 60
  `;
  console.log('Top companies with missing employer_url:');
  for (const r of rows) {
    console.log(`${r.count.toString().padStart(4, ' ')} | ${r.company_name}`);
  }
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
});
