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

async function analyze() {
  const [total] = await sql`SELECT count(*) FROM jobs`;
  console.log('Total jobs:', total.count);

  const [aggFlagged] = await sql`SELECT count(*) FROM jobs WHERE is_aggregator_source = true`;
  console.log('is_aggregator_source = true:', aggFlagged.count);

  const [noEmployer] = await sql`SELECT count(*) FROM jobs WHERE employer_url IS NULL OR trim(employer_url) = ''`;
  console.log('employer_url IS NULL or empty:', noEmployer.count);

  // Check how many have aggregator in employer_url or source_url
  const aggregatorConditions = AGGREGATOR_PATTERNS.map(p => `employer_url ILIKE '${p}' OR source_url ILIKE '${p}'`).join(' OR ');

  const [aggUrls] = await sql.unsafe(`SELECT count(*) FROM jobs WHERE ${aggConditionsSql(AGGREGATOR_PATTERNS)}`);
  console.log('Jobs matching aggregator pattern in employer_url or source_url:', aggUrls.count);

  // Check valid direct employer jobs (where employer_url is not null, not empty, not aggregator, and is_aggregator_source = false)
  const [cleanDirect] = await sql.unsafe(`
    SELECT count(*) FROM jobs 
    WHERE is_aggregator_source = false 
      AND employer_url IS NOT NULL 
      AND trim(employer_url) != ''
      AND NOT (${aggConditionsSql(AGGREGATOR_PATTERNS)})
  `);
  console.log('Clean direct employer jobs:', cleanDirect.count);

  // Sample some clean direct employer jobs
  const cleanSamples = await sql.unsafe(`
    SELECT id, title, company_name, employer_url, source_url FROM jobs 
    WHERE is_aggregator_source = false 
      AND employer_url IS NOT NULL 
      AND trim(employer_url) != ''
      AND NOT (${aggConditionsSql(AGGREGATOR_PATTERNS)})
    LIMIT 5
  `);
  console.log('\nSample Clean Direct Jobs:');
  for (const s of cleanSamples) {
    console.log(`- [${s.company_name}] ${s.title}`);
    console.log(`  Employer: ${s.employer_url}`);
    console.log(`  Source:   ${s.source_url}`);
  }

  await sql.end();
}

function aggConditionsSql(patterns) {
  return patterns.map(p => `(employer_url ILIKE '${p}' OR source_url ILIKE '${p}')`).join(' OR ');
}

analyze().catch(console.error);
