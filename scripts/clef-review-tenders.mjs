import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { choice, noul } from '@typesafe-ai/sdk';
import { systemOne } from './clef-client.mjs';

const jev = { systemOne };

const envPath = path.resolve(process.cwd(), '.env.local');
let dbUrl = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      dbUrl = trimmed.split('=').slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    }
  }
}
if (!dbUrl) dbUrl = process.env.DATABASE_URL;

const sql = postgres(dbUrl + (dbUrl.includes('?') ? '&sslmode=require' : '?sslmode=require'), { max: 10 });

async function main() {
  console.log("Fetching sectors...");
  const sectors = await sql`SELECT id, slug, name FROM tender_sectors`;
  const sectorSlugs = sectors.map(s => s.slug);
  const sectorMap = Object.fromEntries(sectors.map(s => [s.slug, s.id]));

  console.log(`Loaded ${sectors.length} sectors.`);

  const batchSize = 50;
  let offset = 0;
  
  let stats = {
    totalProcessed: 0,
    closedUpdated: 0,
    sectorUpdated: 0,
    employerUrlUpdated: 0,
    spamDeleted: 0,
    errors: 0
  };

  while (true) {
    const batch = await sql`
      SELECT id, title, description, sector_id, deadline, status, employer_url, source_url, is_aggregator_source
      FROM tenders
      ORDER BY id
      LIMIT ${batchSize} OFFSET ${offset}
    `;

    if (batch.length === 0) break;

    console.log(`Processing batch ${offset} to ${offset + batch.length - 1}...`);

    let deletedInBatch = 0;
    const concurrency = 10;
    for (let i = 0; i < batch.length; i += concurrency) {
      const slice = batch.slice(i, i + concurrency);
      await Promise.all(slice.map(async (tender) => {
        try {
          const prompt = `Title: ${tender.title}\nDescription: ${(tender.description || '').slice(0, 500)}`;
          let predictedSector = null;

          // Check legitimacy and sector with Clef / Jev
          try {
            const criteria = Object.fromEntries(sectorSlugs.map(s => [s, `Tender category: ${s}`]));
            const res = await jev.systemOne({
              state: prompt,
              questions: {
                isLegit: noul("Is this a legitimate tender, procurement, or official notice, and not spam/scam?"),
                sector: choice("Classify this tender into the most appropriate sector slug based on its title and description.", criteria)
              }
            });

            if (res?.answers?.isLegit?.noul !== undefined && res.answers.isLegit.noul < 0.2) {
              await sql`DELETE FROM tenders WHERE id = ${tender.id}`;
              stats.spamDeleted++;
              deletedInBatch++;
              return;
            }

            predictedSector = res?.answers?.sector?.choice;
          } catch (err) {
            console.error(`Error classifying tender ${tender.id}: ${err.message}`);
          }

          let newStatus = tender.status;
          if (tender.deadline && new Date(tender.deadline) < new Date() && tender.status !== 'closed') {
            newStatus = 'closed';
            stats.closedUpdated++;
          }

          let newSectorId = tender.sector_id;
          if (predictedSector && sectorMap[predictedSector] && sectorMap[predictedSector] !== tender.sector_id) {
            newSectorId = sectorMap[predictedSector];
            stats.sectorUpdated++;
          }

          let newEmployerUrl = tender.employer_url;
          if (!tender.employer_url && tender.is_aggregator_source === false) {
            newEmployerUrl = tender.source_url;
            stats.employerUrlUpdated++;
          }

          if (newStatus !== tender.status || newSectorId !== tender.sector_id || newEmployerUrl !== tender.employer_url) {
            await sql`
              UPDATE tenders 
              SET status = ${newStatus}, sector_id = ${newSectorId}, employer_url = ${newEmployerUrl}
              WHERE id = ${tender.id}
            `;
          }
        } catch (err) {
          console.error(`Error processing tender ${tender.id}:`, err.message);
          stats.errors++;
        }
      }));
    }

    stats.totalProcessed += batch.length;
    offset += batchSize - deletedInBatch;
  }

  console.log("Done reviewing tenders with Clef/Jev!");
  console.log("Stats:", stats);
  await sql.end();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
