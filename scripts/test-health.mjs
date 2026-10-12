import { createRequire } from 'module';
import { join } from 'path';

const projectRoot = process.cwd(); // run from the repo root
const require = createRequire(join(projectRoot, 'package.json'));
const dotenv = require('dotenv');
dotenv.config({ path: join(projectRoot, '.env.local') });

const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 4,
  prepare: false,
});

async function main() {
  const start = Date.now();
  const jobCount = await sql`SELECT COUNT(*) FROM jobs WHERE is_active = true AND (deadline IS NULL OR deadline > NOW())`;
  const tenderCount = await sql`SELECT COUNT(*) FROM tenders WHERE status = 'open'`;
  const countryCount = await sql`SELECT COUNT(*) FROM countries`;
  const guideCount = await sql`SELECT COUNT(*) FROM guides WHERE is_published = true`;
  const latency = Date.now() - start;

  console.log("=== HEALTH METRICS ===");
  console.log(`Status: ok`);
  console.log(`Database Latency: ${latency}ms`);
  console.log(`Active Jobs: ${jobCount[0].count}`);
  console.log(`Open Tenders: ${tenderCount[0].count}`);
  console.log(`Supported Countries: ${countryCount[0].count}`);
  console.log(`Published Guides: ${guideCount[0].count}`);

  await sql.end();
}

main().catch(console.error);
