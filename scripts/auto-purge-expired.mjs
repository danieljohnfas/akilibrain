import { createRequire } from 'module';
import { join } from 'path';

const projectRoot = 'C:/Users/nnm/Documents/projects/akilibrain';
const require = createRequire(join(projectRoot, 'package.json'));
const dotenv = require('dotenv');
dotenv.config({ path: join(projectRoot, '.env.local') });

const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

async function main() {
  const expired = await sql`
    SELECT id, title, company_name, deadline
    FROM jobs
    WHERE is_active = true AND deadline < NOW()
  `;
  console.log('Expired jobs detected:', expired);

  if (expired.length > 0) {
    const res = await sql`
      DELETE FROM jobs
      WHERE is_active = true AND deadline < NOW()
    `;
    console.log(`Purged ${res.count} expired job(s).`);
  }

  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
});
