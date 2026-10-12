import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { runAtsSync } from '../src/lib/scrapers/ats-sync';

async function main() {
  console.log("Triggering ATS Synchronization for all registered employers...");
  const inserted = await runAtsSync();
  console.log(`ATS Synchronization finished. Newly inserted authentic jobs: ${inserted}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("ATS sync failed:", err);
  process.exit(1);
});
