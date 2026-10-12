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
  const plan = await sql`
    EXPLAIN ANALYZE
    SELECT id, title, company_name
    FROM jobs
    WHERE is_active = true
      AND to_tsvector('english', title || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', 'Accountant')
    LIMIT 5
  `;
  console.log(plan.map(p => p['QUERY PLAN']).join('\n'));
  await sql.end();
}

main().catch(console.error);
