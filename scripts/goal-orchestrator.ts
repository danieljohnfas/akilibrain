import { spawn } from 'child_process';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const COUNTRIES = ['TZ', 'KE', 'UG', 'RW', 'ET', 'CD', 'BI', 'SO', 'SS'];

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> Running: ${cmd} ${args.join(' ')}`);
    const child = spawn(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('close', (code) => {
      if (code !== 0) {
        console.warn(`Command failed with exit code ${code}`);
      }
      resolve(code);
    });
    child.on('error', reject);
  });
}

async function getJobCount() {
  const [res] = await sql`SELECT COUNT(*)::int as count FROM jobs`;
  return res.count;
}

async function main() {
  console.log("Starting 10x Goal Orchestrator...");
  
  while (true) {
    const count = await getJobCount();
    console.log(`\nCurrent Job Count: ${count} / 100000`);
    
    if (count >= 100000) {
      console.log("We have reached the 10x data target!");
      break;
    }

    // Run scraper for a couple of countries to get a batch
    for (const country of COUNTRIES) {
      const currentCount = await getJobCount();
      if (currentCount >= 100000) break;
      
      console.log(`\nScraping ${country}...`);
      await runCommand(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'scripts/mass-scrape.ts', country]);
      
      // After each country, run Jev and Clef to fix issues immediately as requested
      console.log(`\nRunning Clef Tenders Review...`);
      await runCommand(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'scripts/clef-review-tenders.mjs']);
      
      console.log(`\nRunning Jev Full Review & Enrichment to fix issues...`);
      await runCommand(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'scripts/jev-full-review-enrichment.mjs']);
      
      // Purge decommissioned data
      console.log(`\nPurging decommissioned data...`);
      await runCommand('node', ['scripts/purge-decommissioned.mjs']);
      
      console.log(`\nBatch complete. Validating Data Standards...`);
      await runCommand('node', ['scripts/verify-all-data-standards.mjs']);
    }
  }

  // Final review to ensure everything is perfect
  console.log(`\nRunning FINAL Clef Tenders Review...`);
  await runCommand(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'scripts/clef-review-tenders.mjs']);
  console.log(`\nRunning FINAL Jev Full Review...`);
  await runCommand(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'scripts/jev-full-review-enrichment.mjs']);
  console.log(`\nRunning FINAL Purge...`);
  await runCommand('node', ['scripts/purge-decommissioned.mjs']);
  console.log(`\nRunning FINAL Audit...`);
  await runCommand('node', ['scripts/verify-all-data-standards.mjs']);

  await sql.end();
  console.log("10x GOAL FULLY COMPLETED!");
}

main().catch(async (e) => {
  console.error("Orchestrator failed:", e);
  await sql.end();
  process.exit(1);
});
