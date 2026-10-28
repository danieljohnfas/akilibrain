import postgres from 'postgres';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.trim().startsWith('DATABASE_URL=')) {
    dbUrl = line.trim().slice('DATABASE_URL='.length).trim();
  }
}

const sql = postgres(dbUrl + '?sslmode=require', { max: 3 });

const AGGREGATOR_PATTERNS = [
  '%myjobmag%',
  '%jobinrwanda%',
  '%ajirayako%',
  '%mwanampotevu%',
  '%jobweb%',
  '%brightermonday%',
  '%hotnigerianjobs%',
  '%mediacongo%',
  '%jobinburundi%',
  '%hiiraan%',
  '%fuzu%',
  '%kenyajob%',
  '%ugandajob%',
  '%tanzaniajobs%',
  '%ethiojobs%',
  '%reliefweb%',
  '%unjobs%',
  '%devex%',
  '%impactpool%',
  '%southsudanngoforum%',
  '%evenbreak%',
  '%glassdoor%',
  '%indeed%',
  '%ziprecruiter%'
];

function aggConditionsSql(patterns) {
  return patterns.map(p => `(employer_url ILIKE '${p}' OR source_url ILIKE '${p}')`).join(' OR ');
}

async function purge() {
  console.log('=== PURGING ALL AGGREGATOR JOBS AND JOBS WITHOUT DIRECT EMPLOYER LINKS ===');

  const [initialCount] = await sql`SELECT count(*) FROM jobs`;
  console.log(`Starting total jobs in database: ${initialCount.count}`);

  const aggWhere = `
    is_aggregator_source = true
    OR employer_url IS NULL
    OR trim(employer_url) = ''
    OR ${aggConditionsSql(AGGREGATOR_PATTERNS)}
  `;

  // Find job IDs to delete
  const targetIds = await sql.unsafe(`SELECT id FROM jobs WHERE ${aggWhere}`);
  console.log(`Found ${targetIds.length} aggregator/missing-employer jobs to delete.`);

  if (targetIds.length > 0) {
    const idList = targetIds.map(r => `'${r.id}'`).join(',');

    // Delete any dependent rows in job_applications first
    const deletedApps = await sql.unsafe(`DELETE FROM job_applications WHERE job_id IN (${idList}) RETURNING id`);
    console.log(`Deleted ${deletedApps.length} dependent applications referencing these jobs.`);

    // Delete the jobs themselves
    const deletedJobs = await sql.unsafe(`DELETE FROM jobs WHERE id IN (${idList}) RETURNING id`);
    console.log(`Successfully deleted ${deletedJobs.length} aggregator jobs from database!`);
  }

  const [finalCount] = await sql`SELECT count(*) FROM jobs`;
  console.log(`Remaining direct employer jobs in database: ${finalCount.count}`);

  // Verification: Verify no aggregators or empty employer URLs exist
  const [remainingAggregators] = await sql.unsafe(`
    SELECT count(*) FROM jobs 
    WHERE is_aggregator_source = true 
      OR employer_url IS NULL 
      OR trim(employer_url) = '' 
      OR ${aggConditionsSql(AGGREGATOR_PATTERNS)}
  `);
  console.log(`Remaining aggregator jobs (must be 0): ${remainingAggregators.count}`);

  // Sample remaining jobs
  const sample = await sql`SELECT id, title, company_name, employer_url FROM jobs LIMIT 3`;
  console.log('Verified direct employer job samples:');
  for (const s of sample) {
    console.log(`  - [${s.company_name}] ${s.title} -> ${s.employer_url}`);
  }

  await sql.end();
}

purge().catch(err => {
  console.error('Purge error:', err);
  process.exit(1);
});
