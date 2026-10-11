import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL + '?sslmode=require');

async function removeSyntheticJobs() {
  console.log("Removing all synthetic data...");
  
  const sqlRes = await sql`
    DELETE FROM jobs 
    WHERE source_url ~ '^https://careers\\.[0-9a-f]{8}\\.com/job/[0-9a-f]{32}$'
    RETURNING id
  `;
  console.log(`Deleted ${sqlRes.length} SQL-generated synthetic jobs.`);

  const jsRes = await sql`
    DELETE FROM jobs 
    WHERE source_url ~ 'https://www\\.jobweb[a-z]{2}\\.com/jobs/.*-\\d+$'
    RETURNING id
  `;
  console.log(`Deleted ${jsRes.length} JS-generated synthetic jobs.`);

  const [countRes] = await sql`SELECT count(*)::int as count FROM jobs`;
  console.log(`Total genuine jobs remaining: ${countRes.count}`);

  await sql.end();
}

removeSyntheticJobs().catch(e => {
  console.error(e);
  process.exit(1);
});
