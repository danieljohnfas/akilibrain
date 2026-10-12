import fs from 'fs';

const companies = JSON.parse(fs.readFileSync('scripts/unresolved-companies.json', 'utf8'));

const confidentialPatterns = [
  /reputable/i,
  /confidential/i,
  /undisclosed/i,
  /anonymous/i,
  /client/i,
  /an indigenous/i,
  /verified corporate employer/i,
  /classified/i,
  /leading company/i,
  /private company/i,
];

const confidentialList = [];
const namedList = [];

for (const c of companies) {
  if (confidentialPatterns.some(p => p.test(c.company_name))) {
    confidentialList.push(c);
  } else {
    namedList.push(c);
  }
}

const confJobs = confidentialList.reduce((acc, c) => acc + parseInt(c.cnt), 0);
const namedJobs = namedList.reduce((acc, c) => acc + parseInt(c.cnt), 0);

console.log(`Confidential/Anonymous: ${confidentialList.length} companies (${confJobs} jobs)`);
console.log(`Named Employers: ${namedList.length} companies (${namedJobs} jobs)`);

// Output top 50 named employers
console.log('\nTop Named Employers:');
for (const c of namedList.slice(0, 50)) {
  console.log(`${String(c.cnt).padStart(2)} | ${c.company_name.padEnd(45)} | ${c.sample_url}`);
}
