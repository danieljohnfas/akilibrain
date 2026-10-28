import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkDomains() {
  const hosts = await sql`
    SELECT 
      substring(employer_url from 'https?://([^/]+)') as emp_host,
      count(*)::int as count
    FROM jobs
    GROUP BY emp_host
    ORDER BY count DESC;
  `;
  console.log('Employer hosts in DB:');
  for (const h of hosts) {
    console.log(`  ${h.emp_host}: ${h.count}`);
  }
  await sql.end();
}
checkDomains().catch(console.error);
