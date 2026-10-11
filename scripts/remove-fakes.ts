import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL + '?sslmode=require');

async function removeFakesAndDuplicates() {
  console.log("Identifying fakes and duplicates...");
  
  // 1. Remove explicitly fake/test jobs
  const fakeRes = await sql`
    DELETE FROM jobs 
    WHERE source_url LIKE '%synthetic%' 
       OR title ILIKE '%Test%' 
       OR title ILIKE '%Fake%'
       OR company_name ILIKE '%Test%'
       OR company_name ILIKE '%Fake%'
    RETURNING id
  `;
  console.log(`Deleted ${fakeRes.length} explicit fake/test jobs.`);

  // 2. Remove duplicates created by the fast scaler
  // The fast scaler appended `-' || substr(md5(random()::text), 1, 8)` to source_url
  // We can identify these by checking for this regex pattern at the end of source_url
  const dupRes = await sql`
    DELETE FROM jobs
    WHERE source_url ~ '-[0-9a-f]{8}$'
    RETURNING id
  `;
  console.log(`Deleted ${dupRes.length} duplicated scale jobs.`);

  const [countRes] = await sql`SELECT count(*)::int as count FROM jobs`;
  console.log(`Remaining pristine jobs in database: ${countRes.count}`);

  await sql.end();
}

removeFakesAndDuplicates().catch(e => {
  console.error(e);
  process.exit(1);
});
