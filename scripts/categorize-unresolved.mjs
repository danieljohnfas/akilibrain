import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/unresolved-companies.json', 'utf8'));

console.log(`Total unresolved entries: ${data.length}`);
let genericCount = 0;
let genericJobs = 0;
let namedCount = 0;
let namedJobs = 0;

const genericNames = [];
const namedList = [];

for (const item of data) {
  const name = item.company_name;
  const count = parseInt(item.cnt, 10);
  const isGeneric = /Verified Employer|Anonymous|Public & Private Sector|Various Verified|Reputable|Private Company|A Leading|Confidential/i.test(name);
  if (isGeneric) {
    genericCount++;
    genericJobs += count;
    genericNames.push({ name, count, sample: item.sample_url });
  } else {
    namedCount++;
    namedJobs += count;
    namedList.push({ name, count, sample: item.sample_url });
  }
}

console.log(`Generic/Aggregator company placeholders: ${genericCount} groups, ${genericJobs} jobs`);
console.log(`Named specific companies: ${namedCount} companies, ${namedJobs} jobs`);

fs.writeFileSync('scripts/named-unresolved.json', JSON.stringify(namedList, null, 2));
fs.writeFileSync('scripts/generic-unresolved.json', JSON.stringify(genericNames, null, 2));
console.log('Saved to scripts/named-unresolved.json and scripts/generic-unresolved.json');
