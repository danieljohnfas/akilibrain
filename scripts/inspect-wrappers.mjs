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
      AND (
        company_name LIKE 'Verified Employer%' 
        OR company_name LIKE '%Positions%' 
        OR company_name LIKE '%Posts%' 
        OR company_name IN ('2027 General Election', 'Nationwide', 'Remote')
      )
    ORDER BY company_name, title
  `;

  console.log(`Found ${rows.length} jobs with generic wrappers.`);
  for (const r of rows.slice(0, 30)) {
    console.log(`[${r.company_name}] "${r.title}" -> ${r.source_url}`);
  }

  await sql.end();
}

run().catch(console.error);
