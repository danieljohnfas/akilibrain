// Determine if the page looks like a job posting
const bodyText = $('body').text();
const hasJobIndicators = /Job\s+Location:/i.test(bodyText) || /Job\s+Type:/i.test(bodyText) || /Deadline:/i.test(bodyText);
if (!hasJobIndicators) {
  // No job data detected; leave result empty
} else {
  const job = {};

  // Title
  const ogTitle = $('meta[property="og:title"]').attr('content');
  job.title = ogTitle ? ogTitle.trim() : $('title').text().trim() || undefined;

  // Source URL
  const ogUrl = $('meta[property="og:url"]').attr('content');
  job.sourceUrl = ogUrl ? ogUrl.trim() : undefined;

  // Posted date
  const posted = $('meta[property="article:published_time"]').attr('content');
  if (posted) {
    const d = new Date(posted);
    if (!isNaN(d)) job.postedDateIsoString = d.toISOString();
  }

  // Description (fallback to meta description)
  const descriptionMeta = $('meta[property="og:description"]').attr('content');
  const entryContent = $('.entry-content').text().trim() || $('.post-content').text().trim();
  job.description = entryContent || (descriptionMeta ? descriptionMeta.trim() : undefined);

  // Company name (try to extract from meta description)
  let company = undefined;
  if (descriptionMeta) {
    const m = descriptionMeta.match(/Company:\s*([^\n|]+)/i);
    if (m) company = m[1].trim();
  }
  if (!company) {
    const mBody = bodyText.match(/Company:\s*([^\n|]+)/i);
    if (mBody) company = mBody[1].trim();
  }
  if (company) job.companyName = company;

  // Location
  const locMatch = bodyText.match(/Job\s+Location:\s*([^\n|]+)/i);
  if (locMatch) job.location = locMatch[1].trim();

  // Job type
  const typeMatch = bodyText.match(/Job\s+Type:\s*([^\n|]+)/i);
  if (typeMatch) {
    const raw = typeMatch[1].trim().toLowerCase();
    if (/full[-\s]?time/.test(raw)) job.jobType = 'full_time';
    else if (/part[-\s]?time/.test(raw)) job.jobType = 'part_time';
    else if (/contract/.test(raw)) job.jobType = 'contract';
    else if (/internship/.test(raw)) job.jobType = 'internship';
    else if (/remote/.test(raw)) job.jobType = 'remote';
    else job.jobType = raw.replace(/\s+/g, '_');
  }

  // Deadline
  const deadlineMatch = bodyText.match(/Deadline:\s*([^\n|]+)/i);
  if (deadlineMatch) {
    const d = new Date(deadlineMatch[1].trim());
    if (!isNaN(d)) job.deadlineIsoString = d.toISOString();
  }

  // Salary (look for patterns like "$1000 - $2000")
  const salaryMatch = bodyText.match(/Salary[:\s]*([\$€£]?\s*\d[\d,\.]*)\s*[-–]\s*([\$€£]?\s*\d[\d,\.]*)/i);
  if (salaryMatch) {
    const parseAmount = str => {
      const num = str.replace(/[^\d\.]/g, '');
      return parseFloat(num);
    };
    job.salaryMin = parseAmount(salaryMatch[1]);
    job.salaryMax = parseAmount(salaryMatch[2]);
    const curMatch = salaryMatch[1].match(/[$€£]/);
    if (curMatch) job.salaryCurrency = curMatch[0];
  }

  // Push the job if it has at least a title
  if (job.title) result.push(job);
}