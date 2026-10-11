const jobSelectors = [
  '[class*="job"]',
  '[class*="position"]',
  '[class*="career"]',
  '.job-listing',
  '.job-card',
  '.opening',
  '.vacancy',
  '.posting'
];
const titleSelectors = [
  'h1',
  'h2',
  'h3',
  '.title',
  '.job-title',
  '.position-title',
  '.posting-title'
];
const companySelectors = [
  '.company',
  '.company-name',
  '.employer',
  '.brand'
];
const locationSelectors = [
  '.location',
  '.job-location',
  '.place'
];
const typeSelectors = [
  '.type',
  '.employment-type',
  '.job-type'
];
const descSelectors = [
  '.description',
  '.job-description',
  '.summary',
  'p'
];
const salarySelectors = [
  '.salary',
  '.compensation',
  '.pay'
];
const dateSelectors = [
  '.date-posted',
  '.posted',
  '.date',
  '.published'
];
function extractText(root, selectors) {
  for (const sel of selectors) {
    const txt = root.find(sel).first().text().trim();
    if (txt) return txt;
  }
  return '';
}
function parseSalary(str) {
  const match = str.replace(/,/g, '').match(/([A-Z]{3})?\s*([\d\.]+)\s*(?:-|\sto\s)?\s*([A-Z]{3})?\s*([\d\.]+)?/i);
  if (!match) return {};
  const currency1 = match[1] || match[3] || null;
  const min = parseFloat(match[2]) || null;
  const max = parseFloat(match[4]) || null;
  return {
    salaryCurrency: currency1,
    salaryMin: min,
    salaryMax: max
  };
}
$(jobSelectors.join(',')).each((_, elem) => {
  const $elem = $(elem);
  const title = extractText($elem, titleSelectors);
  if (!title) return;
  const job = {
    title,
    companyName: extractText($elem, companySelectors) || undefined,
    description: extractText($elem, descSelectors) || undefined,
    location: extractText($elem, locationSelectors) || undefined,
    jobType: (function(){
      const txt = extractText($elem, typeSelectors).toLowerCase();
      if (txt.includes('full')) return 'full_time';
      if (txt.includes('part')) return 'part_time';
      if (txt.includes('contract')) return 'contract';
      if (txt.includes('intern')) return 'internship';
      if (txt.includes('remote')) return 'remote';
      return undefined;
    })(),
    sourceUrl: undefined,
    postedDateIsoString: undefined,
    deadlineIsoString: undefined,
    ...parseSalary(extractText($elem, salarySelectors))
  };
  result.push(job);
});