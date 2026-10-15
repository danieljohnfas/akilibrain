import { createRequire } from 'module';
import { join } from 'path';

const projectRoot = 'C:/Users/nnm/Documents/projects/akilibrain';
const require = createRequire(join(projectRoot, 'package.json'));
const dotenv = require('dotenv');
dotenv.config({ path: join(projectRoot, '.env.local') });

const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });

async function main() {
  await sql`
    UPDATE jobs
    SET job_type = 'internship', updated_at = NOW()
    WHERE id = 'f5a7941c-59d7-4361-b1d5-495d86f1978d'
  `;
  console.log('Restored Executive Intern to internship.');
  await sql.end();
}

main();
