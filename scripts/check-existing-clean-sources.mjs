import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkSources() {
  const sources = await sql`
    SELECT 
      company_name, 
      count(*) as cnt, 
      substring(employer_url from 'https?://([^/]+)') as employer_host,
      substring(source_url from 'https?://([^/]+)') as source_host
    FROM jobs 
    GROUP BY company_name, employer_host, source_host
    ORDER BY cnt DESC;
  `;
  console.log(`Distinct company/host groups: ${sources.length}`);
  for (const s of sources.slice(0, 30)) {
    console.log(`  [${s.company_name}] (${s.cnt} jobs) - Employer Host: ${s.employer_host} - Source Host: ${s.source_host}`);
  }

  await sql.end();
}

checkSources().catch(console.error);
