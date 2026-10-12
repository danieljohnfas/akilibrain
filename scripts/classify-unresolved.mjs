import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('c:/Users/nnm/Documents/projects/akilihub/scripts/unresolved-summary.json', 'utf8'));

const named = [];
const confidentialOrAggregator = [];

for (const [company, jobs] of Object.entries(data)) {
  const cLower = company.toLowerCase();
  if (
    cLower.includes('anonymous') ||
    cLower.startsWith('a reputable') ||
    cLower.startsWith('a leading') ||
    cLower.startsWith('a private') ||
    cLower.startsWith('an indigenous') ||
    cLower.startsWith('verified employer') ||
    cLower.includes('financial institution') ||
    cLower.includes('transport sector') ||
    cLower.startsWith('fashion & wellness company') ||
    cLower.startsWith('a retail company') ||
    cLower.startsWith('a telecommunication company') ||
    cLower.startsWith('a professional laundry')
  ) {
    confidentialOrAggregator.push({ company, count: jobs.length, sample: jobs[0] });
  } else {
    named.push({ company, count: jobs.length, sample: jobs[0] });
  }
}

console.log(`Named real employers/enterprises: ${named.length} companies (${named.reduce((s, c) => s + c.count, 0)} jobs)`);
console.log(`Confidential/Anonymous/Agency posts: ${confidentialOrAggregator.length} categories (${confidentialOrAggregator.reduce((s, c) => s + c.count, 0)} jobs)`);

console.log('\n--- NAMED EMPLOYERS ---');
named.forEach(n => console.log(`"${n.company}" (${n.count} jobs) -> ${n.sample.title} [${n.sample.source}]`));

console.log('\n--- CONFIDENTIAL / ANONYMOUS ---');
confidentialOrAggregator.forEach(c => console.log(`"${c.company}" (${c.count} jobs) -> ${c.sample.title}`));
