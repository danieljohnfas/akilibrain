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
  const rows = await sql`
    SELECT id, title, company_name, source_url
    FROM jobs
    WHERE is_active = true AND employer_url IS NULL
  `;
  console.log(`Total unresolved jobs remaining: ${rows.length}`);

  const confidentialRegex = /^(a\s+reputable|a\s+leading|an\s+indigenous|confidential|undisclosed|private\s+company|anonymous|verified\s+corporate\s+employer|verified\s+employer|public\s+&\s+private\s+sector|various\s+verified)/i;
  
  const confidential = [];
  const named = [];

  for (const r of rows) {
    if (confidentialRegex.test(r.company_name.trim()) || /reputable|confidential/i.test(r.company_name)) {
      confidential.push(r);
    } else {
      named.push(r);
    }
  }

  console.log(`Confidential / Anonymous / Roundups: ${confidential.length}`);
  console.log(`Remaining Named Employers: ${named.length}`);

  console.log('\nSample Confidential:');
  for (const c of confidential.slice(0, 15)) {
    console.log(`  [${c.company_name}] ${c.title.slice(0, 50)}`);
  }

  console.log('\nTop Remaining Named:');
  const counts = {};
  for (const n of named) {
    counts[n.company_name] = (counts[n.company_name] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
  for (const [name, count] of sorted.slice(0, 30)) {
    console.log(`  ${String(count).padStart(2)} | ${name}`);
  }

  await sql.end();
}

main().catch(console.error);
