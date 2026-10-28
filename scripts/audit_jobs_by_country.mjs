import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function auditJobsByCountry() {
  console.log('=== AUDITING JOBS ACROSS ALL COUNTRIES IN DATABASE ===\n');

  // 1. Total jobs count
  const [{ total_jobs }] = await sql`SELECT count(*)::int as total_jobs FROM jobs;`;
  const [{ active_jobs }] = await sql`SELECT count(*)::int as active_jobs FROM jobs WHERE is_active = true;`;
  console.log(`Total Jobs in DB: ${total_jobs}`);
  console.log(`Active Jobs in DB: ${active_jobs}\n`);

  // 2. Jobs by country with details
  const breakdown = await sql`
    SELECT 
      c.id as country_id,
      c.name as country_name,
      c.code as country_code,
      count(j.id)::int as total_jobs,
      count(CASE WHEN j.is_active = true THEN 1 END)::int as active_jobs,
      count(CASE WHEN j.is_aggregator_source = true THEN 1 END)::int as aggregator_jobs,
      count(CASE WHEN j.employer_url IS NOT NULL AND trim(j.employer_url) <> '' THEN 1 END)::int as direct_employer_jobs
    FROM countries c
    LEFT JOIN jobs j ON j.country_id = c.id
    GROUP BY c.id, c.name, c.code
    ORDER BY total_jobs DESC, c.name ASC;
  `;

  console.log('Country Breakdown:');
  console.log('---------------------------------------------------------------------------------------------------------');
  console.log(
    'Country'.padEnd(32) + 
    'Code'.padEnd(6) + 
    'Total Jobs'.padEnd(14) + 
    'Active'.padEnd(10) + 
    'Direct Employer'.padEnd(18) + 
    'Aggregator'
  );
  console.log('---------------------------------------------------------------------------------------------------------');

  let countriesWithJobs = 0;
  let countriesZeroJobs = 0;

  for (const row of breakdown) {
    if (row.total_jobs > 0) {
      countriesWithJobs++;
      console.log(
        row.country_name.padEnd(32) +
        row.country_code.padEnd(6) +
        String(row.total_jobs).padEnd(14) +
        String(row.active_jobs).padEnd(10) +
        String(row.direct_employer_jobs).padEnd(18) +
        String(row.aggregator_jobs)
      );
    } else {
      countriesZeroJobs++;
    }
  }

  console.log('---------------------------------------------------------------------------------------------------------');
  console.log(`Countries with jobs: ${countriesWithJobs} | Countries with 0 jobs: ${countriesZeroJobs} | Total Countries: ${breakdown.length}\n`);

  // 3. Any jobs with NULL country_id?
  const [{ null_country_jobs }] = await sql`SELECT count(*)::int as null_country_jobs FROM jobs WHERE country_id IS NULL;`;
  console.log(`Jobs with NULL country_id: ${null_country_jobs}`);

  // 4. Sample top employers per country with jobs
  console.log('\nTop Employers in Each Active Country:');
  for (const row of breakdown) {
    if (row.total_jobs > 0) {
      const topEmployers = await sql`
        SELECT company_name, count(*)::int as cnt
        FROM jobs
        WHERE country_id = ${row.country_id}
        GROUP BY company_name
        ORDER BY cnt DESC
        LIMIT 3;
      `;
      const empStr = topEmployers.map(e => `${e.company_name} (${e.cnt})`).join(', ');
      console.log(`- ${row.country_name} (${row.total_jobs} jobs): ${empStr}`);
    }
  }

  await sql.end();
}

auditJobsByCountry().catch(console.error);
