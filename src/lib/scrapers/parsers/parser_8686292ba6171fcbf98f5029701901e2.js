// Helper to fetch meta content by name or property
function getMetaContent(selector) {
  const el = $(selector).first();
  return el.length ? (el.attr('content') || '').trim() : '';
}

// Determine if this page represents a job posting
const pageTitle = $('title').text().trim();
const ogTitle = getMetaContent('meta[property="og:title"]');
const jobTitle = ogTitle || pageTitle;

if (jobTitle) {
  const job = {};

  // Title
  job.title = jobTitle;

  // Company name (often in og:site_name)
  const company = getMetaContent('meta[property="og:site_name"]');
  if (company) job.companyName = company;

  // Description (prefer og:description, fallback to meta description)
  const description = getMetaContent('meta[property="og:description"]') || getMetaContent('meta[name="description"]');
  if (description) job.description = description;

  // Location (common selectors on TeamTailor pages)
  const locationEl = $('.location, .job-location, [data-location]').first();
  if (locationEl.length) {
    job.location = locationEl.text().trim();
  }

  // Job type (full_time, part_time, contract, internship, remote)
  const typeEl = $('.job-type, .employment-type, [data-job-type]').first();
  if (typeEl.length) {
    const typeText = typeEl.text().trim().toLowerCase();
    if (typeText.includes('full')) job.jobType = 'full_time';
    else if (typeText.includes('part')) job.jobType = 'part_time';
    else if (typeText.includes('contract')) job.jobType = 'contract';
    else if (typeText.includes('intern')) job.jobType = 'internship';
    else if (typeText.includes('remote')) job.jobType = 'remote';
    else job.jobType = typeText;
  }

  // Source URL
  const source = getMetaContent('meta[property="og:url"]');
  if (source) job.sourceUrl = source;

  // Posted date
  const posted = getMetaContent('meta[property="article:published_time"]');
  if (posted) job.postedDateIsoString = new Date(posted).toISOString();

  // Deadline (some TeamTailor pages use meta[name="application-deadline"])
  const deadline = getMetaContent('meta[name="application-deadline"]');
  if (deadline) job.deadlineIsoString = new Date(deadline).toISOString();

  // Salary information (TeamTailor may embed in data attributes)
  const salaryMin = $('.salary-min, [data-salary-min]').first().text().replace(/[^\d]/g, '');
  const salaryMax = $('.salary-max, [data-salary-max]').first().text().replace(/[^\d]/g, '');
  const currency = $('.salary-currency, [data-salary-currency]').first().text().trim();

  if (salaryMin) job.salaryMin = Number(salaryMin);
  if (salaryMax) job.salaryMax = Number(salaryMax);
  if (currency) job.salaryCurrency = currency;

  // Push the extracted job object to the global result array
  result.push(job);
}