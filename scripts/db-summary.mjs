import postgres from 'postgres';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
for (const line of env.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k && !k.startsWith('#')) process.env[k.trim()] = v.join('=').trim();
}

const sql = postgres(process.env.DATABASE_URL + '?sslmode=require', { max: 1 });

async function run() {
  const [j] = await sql`SELECT count(*)::int as c FROM jobs`;
  const [jDirect] = await sql`SELECT count(*)::int as c FROM jobs WHERE employer_url IS NOT NULL`;
  const [e] = await sql`SELECT count(*)::int as c FROM employers`;
  const [t] = await sql`SELECT count(*)::int as c FROM tenders`;
  const [c] = await sql`SELECT count(*)::int as c FROM compliance_requirements`;
  const [s] = await sql`SELECT count(*)::int as c FROM salary_submissions`;
  const [g] = await sql`SELECT count(*)::int as c FROM guides`;
  const [b] = await sql`SELECT count(*)::int as c FROM businesses`;

  console.log(JSON.stringify({
    jobs: j.c,
    jobsWithDirectUrl: jDirect.c,
    employers: e.c,
    tenders: t.c,
    compliance: c.c,
    salaries: s.c,
    guides: g.c,
    businesses: b.c
  }, null, 2));

  await sql.end();
}

run().catch(console.error);
