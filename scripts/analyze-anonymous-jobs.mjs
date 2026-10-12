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
  const confidentialPatterns = [
    'Verified Employer%',
    'Anonymous Employer%',
    'Various Verified Employers%',
    'Public & Private Sector Employers%',
    'Reputable %',
    'A Reputable %',
    'a Reputable %',
    'A Private Company%',
    'Confidential%'
  ];

  const confidentialCountRes = await sql`
    SELECT count(*)::int as count
    FROM jobs
    WHERE is_active = true 
      AND employer_url IS NULL
      AND (
        company_name ILIKE ANY(${confidentialPatterns})
      )
  `;

  const totalMissingRes = await sql`
    SELECT count(*)::int as count
    FROM jobs
    WHERE is_active = true 
      AND employer_url IS NULL
  `;

  const totalMissing = totalMissingRes[0].count;
  const confidentialCount = confidentialCountRes[0].count;
  const namedRemaining = totalMissing - confidentialCount;

  console.log(`Total missing employer_url: ${totalMissing}`);
  console.log(`Confidential/Anonymous client postings: ${confidentialCount}`);
  console.log(`Named companies remaining: ${namedRemaining}`);

  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
});
