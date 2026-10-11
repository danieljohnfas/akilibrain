const job = {};

// Title
const ogTitle = $('meta[property="og:title"]').attr('content');
if (ogTitle) {
  job.title = ogTitle.split(' at ')[0].trim();
}

// Company
const ogSiteName = $('meta[property="og:site_name"]').attr('content');
if (ogSiteName) {
  job.companyName = ogSiteName.trim();
}

// Location
const locationEl = $('.jp-sidebar-item:contains("Location") .jp-sidebar-item-data').first();
if (locationEl.length) {
  job.location = locationEl.text().trim();
}

// Salary
const salaryEl = $('.jp-sidebar-item:contains("Salary") .jp-sidebar-item-data').first();
if (salaryEl.length) {
  const salaryText = salaryEl.text().trim();
  job.description = salaryText; // temporary, will parse later
  // Parse salary if possible (e.g., "TZS 500,000 - 800,000 per month")
  const salaryMatch = salaryText.match(/([A-Z]{3})\s*([\d,]+)\s*[-–]\s*([\d,]+)/i);
  if (salaryMatch) {
    job.salaryCurrency = salaryMatch[1];
    job.salaryMin = parseInt(salaryMatch[2].replace(/,/g, ''), 10);
    job.salaryMax = parseInt(salaryMatch[3].replace(/,/g, ''), 10);
  } else {
    // Try single value
    const singleMatch = salaryText.match(/([A-Z]{3})\s*([\d,]+)/i);
    if (singleMatch) {
      job.salaryCurrency = singleMatch[1];
      job.salaryMin = parseInt(singleMatch[2].replace(/,/g, ''), 10);
      job.salaryMax = job.salaryMin;
    }
  }
}

// Description from og:description
const ogDesc = $('meta[property="og:description"]').attr('content');
if (ogDesc) {
  job.description = ogDesc.trim();
}

// Source URL
const ogUrl = $('meta[property="og:url"]').attr('content');
if (ogUrl) {
  job.sourceUrl = ogUrl.trim();
}

// Posted date from og:updated_time (Unix timestamp)
const ogUpdated = $('meta[property="og:updated_time"]').attr('content');
if (ogUpdated) {
  const timestamp = parseInt(ogUpdated, 10);
  if (!isNaN(timestamp)) {
    job.postedDateIsoString = new Date(timestamp * 1000).toISOString();
  }
}

// Job type - not explicitly in HTML, default to full_time
job.jobType = 'full_time';

// Deadline not available
job.deadlineIsoString = '';

// Push to result
result.push(job);