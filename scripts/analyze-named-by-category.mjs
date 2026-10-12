import fs from 'fs';

const companies = JSON.parse(fs.readFileSync('scripts/unresolved-companies.json', 'utf8'));

const bankList = [];
const healthList = [];
const eduList = [];
const govNgoList = [];
const corporateList = [];

for (const c of companies) {
  const name = c.company_name;
  if (/bank|sacco|microfinance|invest/i.test(name)) {
    bankList.push(c);
  } else if (/hospital|health|medical|clinic|pharma/i.test(name)) {
    healthList.push(c);
  } else if (/university|college|school|academy|institute/i.test(name)) {
    eduList.push(c);
  } else if (/foundation|council|association|ministry|government|trust|society|fund/i.test(name)) {
    govNgoList.push(c);
  } else {
    corporateList.push(c);
  }
}

console.log(`Financial: ${bankList.length} companies (${bankList.reduce((a,c)=>a+parseInt(c.cnt),0)} jobs)`);
console.log(`Health: ${healthList.length} companies (${healthList.reduce((a,c)=>a+parseInt(c.cnt),0)} jobs)`);
console.log(`Education: ${eduList.length} companies (${eduList.reduce((a,c)=>a+parseInt(c.cnt),0)} jobs)`);
console.log(`Gov/NGO/Trust: ${govNgoList.length} companies (${govNgoList.reduce((a,c)=>a+parseInt(c.cnt),0)} jobs)`);
console.log(`Other Corporate: ${corporateList.length} companies (${corporateList.reduce((a,c)=>a+parseInt(c.cnt),0)} jobs)`);

console.log('\n--- TOP FINANCIAL ---');
for (const c of bankList.slice(0, 25)) console.log(`  ${c.cnt} | ${c.company_name}`);

console.log('\n--- TOP HEALTH ---');
for (const c of healthList.slice(0, 25)) console.log(`  ${c.cnt} | ${c.company_name}`);

console.log('\n--- TOP EDUCATION ---');
for (const c of eduList.slice(0, 25)) console.log(`  ${c.cnt} | ${c.company_name}`);

console.log('\n--- TOP GOV/NGO ---');
for (const c of govNgoList.slice(0, 25)) console.log(`  ${c.cnt} | ${c.company_name}`);
