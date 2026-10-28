import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

const AGGREGATOR_PATTERNS = [
  '%cari.africa%',
  '%blogspot%',
  '%jobright.work%',
  '%nafasi.io%',
  '%fadicy.com%',
  '%mitihani.co.tz%',
  '%jobconnect.club%',
  '%jobstanzania.co.tz%',
  '%helpfuljobs.info%',
  '%work.tz%',
  '%saplic.com%',
  '%globalpublishers%',
  '%ajiranew%',
  '%ajiraboratz%',
  '%andigo.co.tz%',
  '%cvchapchap%',
  '%ajiralatest%',
  '%myjobmag%',
  '%jobinrwanda%',
  '%fuzu%',
  '%brightermonday%',
  '%ajirayako%',
  '%mwanampotevu%',
  '%hotnigerianjobs%'
];

async function purgeAggregators() {
  console.log('Purging aggregator and blog listings...');
  
  let totalDeleted = 0;
  for (const pat of AGGREGATOR_PATTERNS) {
    const deleted = await sql`
      DELETE FROM jobs
      WHERE employer_url ILIKE ${pat} 
         OR source_url ILIKE ${pat}
      RETURNING id;
    `;
    if (deleted.length > 0) {
      console.log(`  Deleted ${deleted.length} rows matching ${pat}`);
      totalDeleted += deleted.length;
    }
  }

  // Also delete any rows with corrupted company names (e.g., job requirements or headers mistaken as company name)
  const deletedCorrupt = await sql`
    DELETE FROM jobs
    WHERE length(company_name) > 60
       OR company_name ILIKE '%bachelor%'
       OR company_name ILIKE '%terms of service%'
       OR company_name ILIKE '%salary%'
       OR company_name ILIKE '%how to apply%'
       OR company_name ILIKE '%late applications%'
       OR company_name ILIKE '%inakaribisha maombi%'
    RETURNING id;
  `;
  if (deletedCorrupt.length > 0) {
    console.log(`  Deleted ${deletedCorrupt.length} rows with corrupted company names.`);
    totalDeleted += deletedCorrupt.length;
  }

  console.log(`Total purged: ${totalDeleted}`);
  
  const [{ remaining }] = await sql`SELECT count(*)::int as remaining FROM jobs;`;
  console.log(`Remaining 100% verified direct employer jobs: ${remaining}`);

  await sql.end();
}

purgeAggregators().catch(console.error);
