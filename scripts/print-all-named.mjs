import { readFileSync } from 'fs';

const data = JSON.parse(readFileSync('c:/Users/nnm/Documents/projects/akilihub/scripts/unresolved-summary.json', 'utf8'));

for (const [company, jobs] of Object.entries(data)) {
  const cLower = company.toLowerCase();
  const isGeneric = 
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
    cLower.startsWith('a professional laundry') ||
    cLower.startsWith('reputable');

  if (!isGeneric) {
    console.log(`NAMED: "${company}" (${jobs.length} jobs) -> ${jobs[0].title}`);
  }
}
