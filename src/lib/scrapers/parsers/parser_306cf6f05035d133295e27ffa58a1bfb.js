// Extract title
const titleEl = $('#job h2').first();
if (titleEl.length) {
  const job = {};

  const title = titleEl.text().trim();
  if (title) job.title = title;

  // Company name from meta og:site_name if available
  const company = $('meta[property="og:site_name"]').attr('content');
  if (company) job.companyName = company.trim();

  // Description: concatenate all paragraphs within #job-content
  const description = $('#job-content p')
    .map((i, el) => $(el).text().trim())
    .get()
    .filter(txt => txt.length)
    .join('\n\n');
  if (description) job.description = description;

  // Location: try to extract after the last dash in the title
  const dashParts = title.split(' - ');
  if (dashParts.length > 1) {
    const locPart = dashParts[dashParts.length - 1].split(',')[0].trim();
    if (locPart) job.location = locPart;
  }

  // Job type mapping
  const typeMap = {
    FT: 'full_time',
    'Full Time': 'full_time',
    PT: 'part_time',
    'Part Time': 'part_time',
    Contract: 'contract',
    Internship: 'internship',
    Remote: 'remote',
    'Fixed Term Appointment': 'full_time'
  };
  for (const key in typeMap) {
    const re = new RegExp(`\\b${key}\\b`, 'i');
    if (re.test(title)) {
      job.jobType = typeMap[key];
      break;
    }
  }

  // Source URL from canonical link
  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) job.sourceUrl = canonical.trim();

  // Push the job object to the result array
  result.push(job);
}