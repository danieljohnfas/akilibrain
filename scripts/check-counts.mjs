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
  const [stats] = await sql`
    SELECT 
      COUNT(*) as total_active,
      COUNT(employer_url) as with_employer_url,
      COUNT(*) FILTER (WHERE employer_url IS NULL OR employer_url = '') as without_employer_url,
      COUNT(*) FILTER (WHERE is_aggregator_source = true) as is_aggregator_true,
      COUNT(*) FILTER (WHERE is_aggregator_source = false) as is_aggregator_false,
      COUNT(*) FILTER (WHERE employer_url IS NOT NULL AND is_aggregator_source = true) as resolved_but_agg_flag_true,
      COUNT(*) FILTER (WHERE (employer_url IS NULL OR employer_url = '') AND is_aggregator_source = true) as null_employer_and_agg_true
    FROM jobs
    WHERE is_active = true
  `;
  console.log(stats);

  const unresolved = await sql`
    SELECT id, title, company_name, source_url
    FROM jobs
    WHERE is_active = true
      AND (employer_url IS NULL OR employer_url = '')
    ORDER BY company_name ASC
  `;
  console.log(`\nRemaining without employer_url: ${unresolved.length}`);
  unresolved.slice(0, 50).forEach(u => console.log(`- "${u.company_name}": "${u.title}" (${u.source_url})`));

  await sql.end();
}

main().catch(console.error);
