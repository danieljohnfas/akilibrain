import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function main() {
  const countries = await sql`SELECT id, name, code FROM countries ORDER BY name;`;
  console.log(JSON.stringify(countries, null, 2));
  await sql.end();
}
main();
