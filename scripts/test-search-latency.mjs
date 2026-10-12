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

async function testSearch(query) {
  const start = Date.now();
  const results = await sql`
    SELECT id, title, company_name
    FROM jobs
    WHERE is_active = true
      AND to_tsvector('english', title || ' ' || coalesce(description, '')) @@ plainto_tsquery('english', ${query})
    LIMIT 5
  `;
  const elapsed = Date.now() - start;
  console.log(`Query "${query}": ${results.length} results returned in ${elapsed}ms`);
  results.forEach(r => console.log(`  - [${r.company_name}] ${r.title}`));
}

async function main() {
  console.log("Testing PostgreSQL Full-Text Search speed over 10,472 active jobs...");
  await testSearch("Software Engineer");
  await testSearch("Accountant");
  await testSearch("Nurse");
  await testSearch("Project Manager");
  await sql.end();
}

main().catch(console.error);
