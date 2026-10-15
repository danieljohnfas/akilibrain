import { createRequire } from 'module';
import { join } from 'path';

const projectRoot = 'C:/Users/nnm/Documents/projects/akilibrain';
const require = createRequire(join(projectRoot, 'package.json'));
const dotenv = require('dotenv');
dotenv.config({ path: join(projectRoot, '.env.local') });

const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

async function main() {
  const rows = await sql`
    SELECT id, title, company_name, job_type FROM jobs
    WHERE is_active = true 
      AND (title ILIKE '%director%' OR title ILIKE '%head of%' OR title ILIKE '%chief%')
      AND job_type = 'internship'
  `;
  console.log('Affected roles:', rows);

  for (const r of rows) {
    await sql`
      UPDATE jobs
      SET job_type = 'full_time', updated_at = NOW()
      WHERE id = ${r.id}
    `;
  }
  console.log(`Updated ${rows.length} roles to full_time.`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
});
