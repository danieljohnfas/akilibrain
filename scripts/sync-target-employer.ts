import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import fs from 'fs';
import { db } from '../src/lib/db/client';
import { jobs } from '../src/lib/db/schema/jobs';
import { fetchOracleJobs } from '../src/lib/scrapers/ats-handlers/oracle';
import { fetchWorkdayJobs } from '../src/lib/scrapers/ats-handlers/workday';
import { fetchGreenhouseJobs } from '../src/lib/scrapers/ats-handlers/greenhouse';
import { fetchLeverJobs } from '../src/lib/scrapers/ats-handlers/lever';
import { fetchSmartRecruitersJobs } from '../src/lib/scrapers/ats-handlers/smartrecruiters';
import { fetchAshbyJobs } from '../src/lib/scrapers/ats-handlers/ashby';
import { fetchPinpointJobs } from '../src/lib/scrapers/ats-handlers/pinpoint';
import { fetchWorkableJobs } from '../src/lib/scrapers/ats-handlers/workable';
import { fetchBreezyJobs } from '../src/lib/scrapers/ats-handlers/breezy';

async function main() {
  const targetName = process.argv[2];
  if (!targetName) {
    console.error("Usage: npx tsx scripts/sync-target-employer.ts <companyName>");
    process.exit(1);
  }

  const registryPath = path.join(process.cwd(), 'src/lib/sources/ats-registry.json');
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  const config = registry.find((c: any) => 
    (c.companyName || c.company).toLowerCase().includes(targetName.toLowerCase())
  );

  if (!config) {
    console.error(`Company '${targetName}' not found in ats-registry.json`);
    process.exit(1);
  }

  const atsType = (config.atsType || "").toLowerCase();
  console.log(`Syncing target employer: ${config.companyName} (${atsType})...`);

  let scrapedJobs: any[] = [];
  if (atsType === 'workable') {
    scrapedJobs = await fetchWorkableJobs(config);
  } else if (atsType === 'breezy') {
    scrapedJobs = await fetchBreezyJobs(config);
  } else if (atsType === 'lever') {
    scrapedJobs = await fetchLeverJobs(config);
  } else if (atsType === 'greenhouse') {
    scrapedJobs = await fetchGreenhouseJobs(config);
  } else if (atsType === 'ashby') {
    scrapedJobs = await fetchAshbyJobs(config);
  } else if (atsType === 'pinpoint') {
    scrapedJobs = await fetchPinpointJobs(config);
  } else if (atsType === 'smartrecruiters') {
    scrapedJobs = await fetchSmartRecruitersJobs(config);
  } else if (atsType === 'oracle_hcm') {
    scrapedJobs = await fetchOracleJobs(config);
  } else if (atsType === 'workday') {
    scrapedJobs = await fetchWorkdayJobs(config);
  }

  console.log(`Fetched ${scrapedJobs.length} active jobs for ${config.companyName}.`);

  if (scrapedJobs.length > 0) {
    let inserted = 0;
    for (let i = 0; i < scrapedJobs.length; i += 50) {
      const chunk = scrapedJobs.slice(i, i + 50);
      const res = await db.insert(jobs).values(chunk).onConflictDoNothing().returning({ id: jobs.id });
      inserted += res.length;
    }
    console.log(`Successfully inserted ${inserted} newly verified authentic jobs!`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
