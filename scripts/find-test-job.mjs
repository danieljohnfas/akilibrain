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
  const rows = await sql`
    SELECT id, title, company_name, source_url 
    FROM jobs 
    WHERE source_url LIKE '%synthetic%' 
       OR title ILIKE '%Test%' 
       OR title ILIKE '%Fake%' 
       OR company_name ILIKE '%Test%' 
       OR company_name ILIKE '%Fake%'
  `;
  console.log('Offending row:', rows);
  await sql.end();
}

main().catch(console.error);
