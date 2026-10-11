// extract title
let title = $('h1').first().text().trim();
if (!title) {
  const metaTitle = $('title').text();
  if (metaTitle) title = metaTitle.split('|')[0].trim();
}
if (!title) {
  // no clear job title, exit without adding anything
  return;
}

// build job object
const job = { title };

// company name (try meta author or title after '|')
let company = $('meta[name="author"]').attr('content');
if (!company) {
  const metaTitle = $('title').text();
  const parts = metaTitle.split('|');
  if (parts.length > 1) company = parts[1].trim();
}
if (company) job.companyName = company;

// description (common containers)
const descSelectors = [
  '.entry-content',
  '.post-content',
  '.job-description',
  '#content',
  '.et_pb_section'
];
let description = '';
for (const sel of descSelectors) {
  const txt = $(sel).first().text().trim();
  if (txt) { description = txt; break; }
}
if (description) job.description = description;

// location (look for label "Location")
let locationLabel = $('*:contains("Location")')
  .filter(function () {
    return /Location\s*[:\-]/i.test($(this).text());
  })
  .first()
  .text();
if (locationLabel) {
  const match = locationLabel.match(/Location\s*[:\-]\s*(.+)/i);
  if (match) job.location = match[1].trim();
}

// posted date
let posted = $('meta[property="article:published_time"]').attr('content') ||
             $('time.published').attr('datetime');
if (posted) {
  const iso = new Date(posted).toISOString();
  if (!isNaN(Date.parse(iso))) job.postedDateIsoString = iso;
}

// deadline date
let deadline = $('meta[property="article:expiration_time"]').attr('content') ||
               $('time.expiration').attr('datetime');
if (deadline) {
  const iso = new Date(deadline).toISOString();
  if (!isNaN(Date.parse(iso))) job.deadlineIsoString = iso;
}

// salary (simple parsing)
let salaryText = $('*:contains("Salary")').text();
if (salaryText) {
  let m = salaryText.match(/Salary\s*[:\-\s]*([\d,]+)\s*[-–]\s*([\d,]+)/i);
  if (m) {
    job.salaryMin = parseInt(m[1].replace(/,/g, ''), 10);
    job.salaryMax = parseInt(m[2].replace(/,/g, ''), 10);
  } else {
    m = salaryText.match(/Salary\s*[:\-\s]*([\d,]+)/i);
    if (m) {
      const val = parseInt(m[1].replace(/,/g, ''), 10);
      job.salaryMin = job.salaryMax = val;
    }
  }
  if (/\$|USD/i.test(salaryText)) job.salaryCurrency = 'USD';
  else if (/€|EUR/i.test(salaryText)) job.salaryCurrency = 'EUR';
}

// job type
let typeText = $('*:contains("Job Type")').text();
if (typeText) {
  const m = typeText.match(/Job Type\s*[:\-\s]*([A-Za-z ]+)/i);
  if (m) {
    const raw = m[1].trim().toLowerCase();
    const map = {
      'full time': 'full_time',
      'full-time': 'full_time',
      'part time': 'part_time',
      'part-time': 'part_time',
      'contract': 'contract',
      'internship': 'internship',
      'remote': 'remote'
    };
    job.jobType = map[raw] || raw.replace(/\s+/g, '_');
  }
}

// source URL (if window.location is available)
if (typeof window !== 'undefined' && window.location && window.location.href) {
  job.sourceUrl = window.location.href;
}

// push result if we have at least a title
result.push(job);