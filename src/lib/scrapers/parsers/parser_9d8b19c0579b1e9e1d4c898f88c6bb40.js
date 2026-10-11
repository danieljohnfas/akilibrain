// Determine possible job containers
let containers = $('.job-listing, .job-detail, article, .post').filter(function() {
  return $(this).find('h1, .entry-title, .job-title').length > 0;
});
if (containers.length === 0) {
  // Fallback to whole document if a clear title exists
  const possibleTitle = $('h1, .entry-title, .job-title').first().text().trim();
  if (possibleTitle) containers = $('body');
}

// Helper to extract first non‑empty trimmed text
const firstText = (sel, ctx = $) => {
  const txt = ctx(sel).first().text().trim();
  return txt || undefined;
};

// Helper to parse salary strings
const parseSalary = (text) => {
  if (!text) return {};
  const regex = /([\d,.]+)\s*(?:-|\sto\s)\s*([\d,.]+)\s*([A-Za-z$€£]*)/i;
  const match = text.replace(/,/g, '').match(regex);
  if (!match) return {};
  const min = parseFloat(match[1]);
  const max = parseFloat(match[2]);
  const currency = match[3] || undefined;
  return { salaryMin: isNaN(min) ? undefined : min, salaryMax: isNaN(max) ? undefined : max, salaryCurrency: currency || undefined };
};

// Global metadata
const sourceUrl = $('meta[property="og:url"]').attr('content') || undefined;
const postedDateIsoString = $('meta[property="article:published_time"]').attr('content') || undefined;
const deadlineIsoString = $('meta[property="article:expiration_time"]').attr('content') || undefined;

containers.each(function () {
  const container = $(this);

  const title = firstText('h1, .entry-title, .job-title', container) ||
                $('meta[property="og:title"]').attr('content')?.trim();

  if (!title) return; // No job title, skip

  const companyName = firstText('.company-name, .employer, .job-company, .company', container);
  const description = container.find('.entry-content, .job-description, .description').first().text().trim() || undefined;
  const location = firstText('.job-location, .location', container);
  const typeText = firstText('.job-type, .employment-type, .type', container);
  let jobType;
  if (typeText) {
    const lowered = typeText.toLowerCase();
    if (lowered.includes('full')) jobType = 'full_time';
    else if (lowered.includes('part')) jobType = 'part_time';
    else if (lowered.includes('contract')) jobType = 'contract';
    else if (lowered.includes('intern')) jobType = 'internship';
    else if (lowered.includes('remote')) jobType = 'remote';
  }

  // Attempt to find salary information within container text
  const salaryInfo = parseSalary(container.text());

  const job = {
    title,
    companyName,
    description,
    location,
    jobType,
    sourceUrl,
    postedDateIsoString,
    deadlineIsoString,
    salaryMin: salaryInfo.salaryMin,
    salaryMax: salaryInfo.salaryMax,
    salaryCurrency: salaryInfo.salaryCurrency,
  };

  // Remove undefined keys
  Object.keys(job).forEach(k => job[k] === undefined && delete job[k]);

  result.push(job);
});