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

async function run() {
  const rows = await sql`
    SELECT id, title, company_name, source_url
    FROM jobs
    WHERE 
      is_active = true 
      AND employer_url IS NULL
      AND company_name IN (
        'Verified Employer Kenya',
        'Verified Employer Uganda',
        'Verified Employer Rwanda',
        'Verified Employer Zambia',
        'Verified Corporate Employer Nigeria'
      )
    ORDER BY company_name, title
  `;

  console.log(`Found ${rows.length} jobs in other Verified Employer categories.`);
  for (const r of rows) {
    console.log(`[${r.company_name}] "${r.title}" -> ${r.source_url}`);
  }

  await sql.end();
}

run().catch(console.error);
