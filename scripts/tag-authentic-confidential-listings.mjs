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
  console.log('Classifying authentic confidential, anonymous & curated digest roundup jobs...');

  const confidentialRegex = /^(a\s+reputable|a\s+leading|an\s+indigenous|confidential|undisclosed|private\s+company|anonymous|verified\s+corporate\s+employer|verified\s+employer|public\s+&\s+private\s+sector|various\s+verified)/i;

  const rows = await sql`
    SELECT id, title, company_name
    FROM jobs
    WHERE is_active = true 
      AND employer_url IS NULL 
      AND is_aggregator_source = false
  `;
  console.log(`Checking ${rows.length} pending jobs...`);

  let count = 0;
  for (const r of rows) {
    if (confidentialRegex.test(r.company_name.trim()) || /reputable|confidential|anonymous/i.test(r.company_name)) {
      await sql`
        UPDATE jobs
        SET is_aggregator_source = true,
            updated_at = NOW()
        WHERE id = ${r.id}
      `;
      count++;
    }
  }

  console.log(`Successfully classified ${count} authentic confidential / digest listings as is_aggregator_source = true.`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
