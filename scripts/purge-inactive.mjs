import { createRequire } from 'module';
import { join } from 'path';

const projectRoot = 'C:/Users/nnm/Documents/projects/akilibrain';
const require = createRequire(join(projectRoot, 'package.json'));
const dotenv = require('dotenv');
dotenv.config({ path: join(projectRoot, '.env.local') });

const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

async function main() {
  const [before] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = false`;
  console.log(`Purging ${before.count} inactive/corrupted jobs...`);

  const deleted = await sql`DELETE FROM jobs WHERE is_active = false`;
  console.log(`Deleted ${deleted.count} inactive rows.`);

  const [after] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = false`;
  console.log(`Inactive jobs remaining: ${after.count}`);

  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  await sql.end();
});
