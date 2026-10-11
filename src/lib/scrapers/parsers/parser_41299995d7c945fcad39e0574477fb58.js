// Extract canonical URL as sourceUrl
const sourceUrl = $('link[rel="canonical"]').attr('href')?.trim() || null;

// Extract page title
const fullTitle = $('title').first().text().trim() || '';

// Determine if this page looks like a single job posting
if (fullTitle.toLowerCase().includes('career opportunity') && fullTitle.toLowerCase().includes(' at ')) {
  const job = {};

  // Title (text before " at ")
  const titlePart = fullTitle.split('Career Opportunity:')[1] || fullTitle;
  const titleBeforeAt = titlePart.split(' at ')[0].trim();
  job.title = titleBeforeAt || null;

  // Company name (text after " at " and before "(" if present)
  const afterAt = titlePart.split(' at ')[1] || '';
  const companyPart = afterAt.split('(')[0].trim();
  job.companyName = companyPart || null;

  // Location (text inside parentheses)
  const locMatch = afterAt.match(/\(([^)]+)\)/);
  job.location = locMatch ? locMatch[1].trim() : null;

  // Description – try common article containers
  const descriptionText = $('article, .post-body, .content, .entry-content, .post-content')
    .first()
    .text()
    .trim();
  job.description = descriptionText || null;

  // Source URL
  job.sourceUrl = sourceUrl;

  // Posted date – look for standard meta tags
  const postedMeta =
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    null;
  job.postedDateIsoString = postedMeta ? new Date(postedMeta).toISOString() : null;

  // Deadline – look for a meta tag or textual hint
  const deadlineMeta =
    $('meta[property="article:modified_time"]').attr('content') ||
    null;
  job.deadlineIsoString = deadlineMeta ? new Date(deadlineMeta).toISOString() : null;

  // Salary – attempt to extract numbers and currency from description
  const salaryRegex = /([A-Z]{3})?\s?[\$€£]?\s?(\d[\d,\.]*)\s?(?:-|\sto\s)\s?([A-Z]{3})?\s?[\$€£]?\s?(\d[\d,\.]*)/i;
  const salaryMatch = descriptionText.match(salaryRegex);
  if (salaryMatch) {
    // Example match groups: [fullMatch, cur1, min, cur2, max]
    const cur1 = salaryMatch[1] || salaryMatch[3] || null;
    const cur2 = salaryMatch[3] || salaryMatch[1] || null;
    const currency = cur1 || cur2 || null;
    const min = parseFloat(salaryMatch[2].replace(/[,]/g, ''));
    const max = parseFloat(salaryMatch[4].replace(/[,]/g, ''));
    job.salaryCurrency = currency;
    job.salaryMin = isNaN(min) ? null : min;
    job.salaryMax = isNaN(max) ? null : max;
  } else {
    job.salaryCurrency = null;
    job.salaryMin = null;
    job.salaryMax = null;
  }

  // Job type – look for keywords in description or title
  const typeText = (job.title + ' ' + (job.description || '')).toLowerCase();
  if (/full[-\s]?time/.test(typeText)) job.jobType = 'full_time';
  else if (/part[-\s]?time/.test(typeText)) job.jobType = 'part_time';
  else if (/contract/.test(typeText)) job.jobType = 'contract';
  else if (/internship/.test(typeText)) job.jobType = 'internship';
  else if (/remote/.test(typeText)) job.jobType = 'remote';
  else job.jobType = null;

  // Push the job object if we have at least a title
  if (job.title) {
    result.push(job);
  }
}