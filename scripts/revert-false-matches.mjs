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

async function revert() {
  const revertedRica = await sql`
    UPDATE jobs 
    SET employer_url = NULL 
    WHERE employer_url = 'https://rica.rw'
    RETURNING id, title, company_name
  `;
  console.log('Reverted all rica matches:', revertedRica.length);
  for (const r of revertedRica) console.log(`  reverted rica: ${r.title} | ${r.company_name}`);

  const revertedAdmi = await sql`
    UPDATE jobs 
    SET employer_url = NULL 
    WHERE employer_url = 'https://admi.ac.ke'
    RETURNING id, title, company_name
  `;
  console.log('Reverted all admi matches:', revertedAdmi.length);
  for (const r of revertedAdmi) console.log(`  reverted admi: ${r.title} | ${r.company_name}`);

  await sql`
    UPDATE jobs 
    SET company_name = 'Public & Private Sector Employers (Uganda)' 
    WHERE company_name = 'Africa Digital Media Institute (ADMI)' 
      AND title ILIKE '%Vacancies Available in Uganda%'
  `;
  await sql`
    UPDATE jobs 
    SET company_name = 'CIMMYT' 
    WHERE company_name = 'Rwanda Institute for Conservation Agriculture (RICA)' 
      AND title ILIKE '%CIMMYT%'
  `;
  await sql`
    UPDATE jobs 
    SET company_name = 'Public & Private Sector Employers (Uganda)' 
    WHERE company_name = 'Africa Digital Media Institute (ADMI)' 
      AND title ILIKE '%Administrative Office Assistant%'
  `;
  console.log('Cleaned reverted company names.');

  await sql.end();
}

revert().catch(console.error);
