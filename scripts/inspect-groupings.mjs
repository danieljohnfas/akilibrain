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
    WHERE 
      is_active = true 
      AND employer_url IS NULL
      AND (
        company_name LIKE 'Public & Private Sector%'
        OR company_name = 'Various Verified Employers'
        OR company_name LIKE 'Verified Employer%'
      )
    ORDER BY company_name, title
  `;

  console.log(`Found ${rows.length} jobs in category groupings.`);
  for (const r of rows) {
    console.log(`[${r.company_name}] "${r.title}" -> ${r.source_url}`);
  }

  await sql.end();
}

run().catch(console.error);
