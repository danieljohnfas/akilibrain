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
  const unresolved = await sql`
    SELECT id, title, company_name, source_url
    FROM jobs
    WHERE is_active = true
      AND (employer_url IS NULL OR employer_url = '')
    ORDER BY company_name ASC
  `;
  console.log(`Remaining count: ${unresolved.length}`);
  const groups = {};
  for (const row of unresolved) {
    if (!groups[row.company_name]) groups[row.company_name] = [];
    groups[row.company_name].push(row);
  }

  for (const [name, rows] of Object.entries(groups)) {
    console.log(`COMPANY: "${name}" (${rows.length})`);
    rows.forEach(r => console.log(`   - [${r.id}] ${r.title} | ${r.source_url}`));
  }

  await sql.end();
}

main().catch(console.error);
