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

async function main() {
  const tenderIndexes = await sql`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'tenders'
  `;
  console.log('Indexes on tenders:');
  tenderIndexes.forEach(i => console.log(`- ${i.indexname}: ${i.indexdef}`));

  const complianceIndexes = await sql`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'compliance_requirements'
  `;
  console.log('\nIndexes on compliance_requirements:');
  complianceIndexes.forEach(i => console.log(`- ${i.indexname}: ${i.indexdef}`));

  await sql.end();
}

main().catch(console.error);
