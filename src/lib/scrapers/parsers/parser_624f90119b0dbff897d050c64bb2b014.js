// Identify all potential job containers
$('.post-card').each(function () {
  const container = $(this);

  // Title extraction – look for a heading link
  const title = container.find('h2 a').first().text().trim();
  if (!title) return; // skip if no clear title

  // Source URL – use the heading link if present, else fallback to og:url meta
  let sourceUrl = container.find('h2 a').first().attr('href');
  if (!sourceUrl) {
    sourceUrl = $('meta[property="og:url"]').attr('content') || '';
  }

  // Description – gather visible text from typical content areas
  const descParts = [];
  container.find('.post-body-full, .info-home, .post-card').contents().each(function () {
    const txt = $(this).text().trim();
    if (txt) descParts.push(txt);
  });
  const description = descParts.join(' ').replace(/\s+/g, ' ');

  // Helper to search for a label followed by a value
  const findLabeled = (label) => {
    const regex = new RegExp(label + '\\s*[:\\-]?\\s*([^\\n]+)', 'i');
    const match = description.match(regex);
    return match ? match[1].trim() : '';
  };

  // Company name – common patterns
  let companyName = findLabeled('Company');
  if (!companyName) {
    companyName = container.find('.company, .company-name, .info-home .author').first().text().trim();
  }

  // Location
  let location = findLabeled('Location');
  if (!location) {
    location = container.find('.location').first().text().trim();
  }

  // Posted date – look for a <time> tag or meta
  let postedDateIsoString = '';
  const timeElem = container.find('time').first();
  if (timeElem.length) {
    const datetime = timeElem.attr('datetime') || timeElem.text();
    const d = new Date(datetime);
    if (!isNaN(d)) postedDateIsoString = d.toISOString();
  } else {
    const metaDate = $('meta[property="article:published_time"]').attr('content');
    if (metaDate) {
      const d = new Date(metaDate);
      if (!isNaN(d)) postedDateIsoString = d.toISOString();
    }
  }

  // Deadline
  let deadlineIsoString = '';
  const deadlineText = findLabeled('Deadline');
  if (deadlineText) {
    const d = new Date(deadlineText);
    if (!isNaN(d)) deadlineIsoString = d.toISOString();
  }

  // Salary parsing – look for patterns like "Tsh 2,000,000 - 3,000,000"
  let salaryMin = null;
  let salaryMax = null;
  let salaryCurrency = null;
  const salaryMatch = description.match(/([A-Za-z]{3,5})\s*([\d,]+)(?:\s*[-–]\s*([\d,]+))?/);
  if (salaryMatch) {
    salaryCurrency = salaryMatch[1];
    salaryMin = Number(salaryMatch[2].replace(/,/g, ''));
    if (salaryMatch[3]) salaryMax = Number(salaryMatch[3].replace(/,/g, ''));
  }

  // Job type detection from keywords
  const typeMap = {
    full_time: /full[-\s]?time/i,
    part_time: /part[-\s]?time/i,
    contract: /contract/i,
    internship: /internship/i,
    remote: /remote/i
  };
  let jobType = '';
  for (const [key, regex] of Object.entries(typeMap)) {
    if (regex.test(description)) {
      jobType = key;
      break;
    }
  }

  // Build the job object
  const job = {
    title,
    companyName: companyName || '',
    description,
    location: location || '',
    jobType,
    sourceUrl,
    postedDateIsoString,
    deadlineIsoString,
    salaryMin,
    salaryMax,
    salaryCurrency: salaryCurrency || ''
  };

  // Ensure we have a meaningful job entry before pushing
  if (title && description.length > 30) {
    result.push(job);
  }
});