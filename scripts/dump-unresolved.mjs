import { createRequire } from 'module';
import { join } from 'path';
import { writeFileSync } from 'fs';

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
  const unresolved = await sql`
    SELECT id, title, company_name, source_url
    FROM jobs
    WHERE is_active = true
      AND (employer_url IS NULL OR employer_url = '')
    ORDER BY company_name ASC
  `;

  const map = {};
  for (const r of unresolved) {
    if (!map[r.company_name]) {
      map[r.company_name] = [];
    }
    map[r.company_name].push({ id: r.id, title: r.title, source: r.source_url });
  }

  writeFileSync(
    join(projectRoot, 'scripts/unresolved-summary.json'),
    JSON.stringify(map, null, 2)
  );

  console.log(`Wrote ${unresolved.length} jobs across ${Object.keys(map).length} company keys to scripts/unresolved-summary.json`);
  await sql.end();
}

main().catch(console.error);
