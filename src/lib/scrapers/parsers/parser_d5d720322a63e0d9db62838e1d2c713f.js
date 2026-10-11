// Helper to clean text
const clean = (txt) => (txt ? txt.trim().replace(/\s+/g, ' ') : '');

// Potential job containers
const jobSelectors = [
  '.job', '.job-item', '.job-listing', '.vacancy', '.career-item',
  'article.job', 'li.job', 'div.position', 'section.opening',
  '[data-job]', '[class*="job-"]', '[id*="job-"]'
];

// Function to detect a valid job title (non‑empty, reasonable length)
const isValidTitle = (t) => t && t.length > 2 && t.length < 150;

// Parse salary string into min, max, currency
function parseSalary(str) {
  const result = { salaryMin: null, salaryMax: null, salaryCurrency: null };
  if (!str) return result;
  const currencyMatch = str.match(/[$£€¥]|[A-Z]{3}/);
  if (currencyMatch) result.salaryCurrency = currencyMatch[0];
  const numbers = str.match(/[\d,]+/g);
  if (numbers) {
    const vals = numbers.map(n => parseInt(n.replace(/,/g, ''), 10));
    if (vals.length === 1) {
      result.salaryMin = result.salaryMax = vals[0];
    } else if (vals.length >= 2) {
      result.salaryMin = Math.min(...vals);
      result.salaryMax = Math.max(...vals);
    }
  }
  return result;
}

// Map common job‑type words to the required enum
function mapJobType(txt) {
  if (!txt) return null;
  const lower = txt.toLowerCase();
  if (/\bfull[-\s]?time\b/.test(lower)) return 'full_time';
  if (/\bpart[-\s]?time\b/.test(lower)) return 'part_time';
  if (/\bcontract\b/.test(lower)) return 'contract';
  if (/\binternship\b/.test(lower)) return 'internship';
  if (/\bremote\b/.test(lower)) return 'remote';
  return null;
}

// Gather all possible job nodes
let jobNodes = [];
jobSelectors.forEach(sel => {
  $(sel).each((_, el) => {
    jobNodes.push(el);
  });
});

// If no obvious containers, try a fallback: look for headings that could be titles
if (jobNodes.length === 0) {
  $('h2, h3, h4').each((_, el) => {
    const heading = clean($(el).text());
    if (isValidTitle(heading)) {
      // check if a sibling/parent contains typical job info
      const container = $(el).closest('section, article, div');
      if (container && container.length) jobNodes.push(container[0]);
    }
  });
}

// Deduplicate nodes
jobNodes = [...new Set(jobNodes.map(el => el))];

// Process each node
jobNodes.forEach(node => {
  const $node = $(node);

  // Attempt to extract a title – prioritize heading tags
  let title = clean($node.find('h1, h2, h3, h4').first().text());
  if (!isValidTitle(title)) {
    title = clean($node.attr('title') || $node.data('title') || '');
  }
  if (!isValidTitle(title)) return; // not a real job

  // Extract other fields
  const companyName = clean($node.find('.company, .company-name, .employer').first().text()) ||
                      clean($node.closest('[class*="company"], [id*="company"]').text());

  const location = clean($node.find('.location, .job-location, .city').first().text());

  const description = clean($node.find('.description, .job-description, p').text());

  const typeRaw = clean($node.find('.type, .job-type, .employment-type').first().text());
  const jobType = mapJobType(typeRaw);

  const sourceUrl = clean($node.find('a.apply, a.apply-now, a[href*="apply"], a[href*="job"]').attr('href'));

  const postedRaw = clean($node.find('.posted, .date-posted, time[datetime]').attr('datetime') ||
                      $node.find('.posted, .date-posted').text());
  const postedDateIsoString = postedRaw ? new Date(postedRaw).toISOString() : null;

  const deadlineRaw = clean($node.find('.deadline, .date-deadline, time[datetime][class*="deadline"]').attr('datetime') ||
                          $node.find('.deadline, .date-deadline').text());
  const deadlineIsoString = deadlineRaw ? new Date(deadlineRaw).toISOString() : null;

  const salaryRaw = clean($node.find('.salary, .compensation, .pay').first().text());
  const { salaryMin, salaryMax, salaryCurrency } = parseSalary(salaryRaw);

  // Build job object
  const job = {
    title,
    companyName: companyName || null,
    description: description || null,
    location: location || null,
    jobType: jobType || null,
    sourceUrl: sourceUrl || null,
    postedDateIsoString: postedDateIsoString || null,
    deadlineIsoString: deadlineIsoString || null,
    salaryMin: salaryMin !== null ? salaryMin : null,
    salaryMax: salaryMax !== null ? salaryMax : null,
    salaryCurrency: salaryCurrency || null
  };

  result.push(job);
});