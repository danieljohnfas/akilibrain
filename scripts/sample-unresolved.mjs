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
  const nextTop = await sql`
    SELECT company_name, count(*)::int as count
    FROM jobs
    WHERE is_active = true AND employer_url IS NULL
      AND company_name NOT ILIKE '%verified employer%'
      AND company_name NOT ILIKE '%anonymous%'
      AND company_name NOT ILIKE '%various%'
      AND company_name NOT ILIKE '%public & private%'
      AND company_name NOT ILIKE '%reputable%'
      AND company_name NOT ILIKE '%a private company%'
    GROUP BY company_name
    HAVING count(*) = 2
    ORDER BY company_name ASC
    OFFSET 70
    LIMIT 40
  `;
  console.log('Specific Employers (2 jobs - batch 3):');
  console.log(nextTop);
  
  const domainCounts = await sql`
    SELECT 
      substring(source_url from 'https?://([^/]+)') as domain,
      count(*)::int as count
    FROM jobs
    WHERE is_active = true AND employer_url IS NULL
    GROUP BY domain
    ORDER BY count DESC
    LIMIT 20
  `;
  const aggCounts = await sql`
    SELECT is_aggregator_source, count(*)::int
    FROM jobs
    WHERE is_active = true AND employer_url IS NULL
    GROUP BY is_aggregator_source
  `;
  console.log('\nAggregator flag breakdown:');
  console.log(aggCounts);
  
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
});
