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

// Import aggregator domains logic directly
const AGGREGATOR_DOMAINS = [
  'fuzu.com', 'brightermonday.co.ke', 'brightermonday.co.tz', 'brightermonday.ug',
  'myjobmag.com', 'myjobmag.co.ke', 'jobwebkenya.com', 'jobwebtanzania.com', 'jobwebuganda.com',
  'reliefweb.int', 'unjobnet.org', 'unjobs.org', 'glassdoor.com', 'indeed.com', 'linkedin.com'
];

function isDirectEmployer(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    
    // Check if it's an ATS or Gov
    if (host.includes('oraclecloud.com') || host.includes('greenhouse.io') || 
        host.includes('lever.co') || host.includes('workday') || 
        host.includes('ashbyhq.com') || host.includes('smartrecruiters.com') ||
        host.includes('workable.com') || host.includes('breezy.hr') ||
        host.includes('pinpointhq.com') || host.includes('bamboohr.com') ||
        host.endsWith('.go.ke') || host.endsWith('.go.tz') || host.endsWith('.gov.rw') ||
        host.endsWith('.gov.ng') || host.endsWith('.gov.et') || host.endsWith('.gov.zm') ||
        host.endsWith('.gov.ug') || host.endsWith('.gov.gh')) {
      return true;
    }

    // Check if it's a known aggregator
    for (const agg of AGGREGATOR_DOMAINS) {
      if (host.includes(agg)) return false;
    }

    // Check if it has a clean company domain structure
    if (u.protocol.startsWith('http') && !host.includes('search') && !host.includes('jobs.')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

async function main() {
  console.log('Fetching active jobs with missing employerUrl...');
  const pending = await sql`
    SELECT id, source_url, company_name 
    FROM jobs 
    WHERE is_active = true AND employer_url IS NULL 
    LIMIT 2000
  `;
  console.log(`Found ${pending.length} jobs to evaluate.`);

  let resolvedCount = 0;
  for (const job of pending) {
    if (isDirectEmployer(job.source_url)) {
      await sql`
        UPDATE jobs 
        SET employer_url = ${job.source_url}, is_aggregator_source = false, updated_at = NOW() 
        WHERE id = ${job.id}
      `;
      resolvedCount++;
    }
  }

  console.log(`Fast-resolved ${resolvedCount} jobs with direct employer URLs!`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
});
