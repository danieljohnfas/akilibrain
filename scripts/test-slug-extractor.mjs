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
    WHERE is_active = true AND employer_url IS NULL AND source_url LIKE '%jobweb%'
  `;
  console.log(`Found ${rows.length} unresolved jobs from jobweb portals.`);

  const samples = [];
  for (const r of rows) {
    const url = r.source_url || '';
    const slug = url.replace(/\/$/, '').split('/').pop() || '';
    
    // Check if company is generic
    const isGeneric = /Verified Employer|Public & Private Sector Employers|Various Verified Employers/i.test(r.company_name);
    if (isGeneric) {
      let inferredCompany = null;
      if (slug.includes('-at-')) {
        inferredCompany = slug.split('-at-')[1];
      } else if (slug.includes('-recruitment-')) {
        inferredCompany = slug.split('-recruitment-')[1];
      } else if (slug.includes('-ongoing-')) {
        inferredCompany = slug.split('-ongoing-')[1];
      }
      if (inferredCompany && inferredCompany.length > 3) {
        samples.push({ title: r.title, slug, inferredCompany, original: r.company_name });
      }
    }
  }

  console.log(`Extracted potential company names for ${samples.length} generic jobs!`);
  console.log('Sample extractions:');
  for (const s of samples.slice(0, 30)) {
    console.log(`[${s.inferredCompany}] <= ${s.slug}`);
  }
  await sql.end();
}
run().catch(console.error);
