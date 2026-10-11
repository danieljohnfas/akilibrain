// Identify possible job containers by common selectors and Schema.org markup
let containers = [];

// CSS selectors for typical job listing elements
const selectorList = [
  '.job',                // generic job class
  '.job-item',
  '.job-listing',
  '.listing-item',
  '.career-item',
  'article[data-schema-type="JobPosting"]',
  '[itemtype="https://schema.org/JobPosting"]',
  '[itemtype="http://schema.org/JobPosting"]'
];

// Gather elements matching any of the selectors
selectorList.forEach(sel => {
  $(sel).each((_, el) => containers.push($(el)));
});

// Also look for structured data scripts containing JobPosting objects
$('script[type="application/ld+json"]').each((_, script) => {
  try {
    const json = JSON.parse($(script).contents().text());
    const processObj = obj => {
      if (obj && (obj['@type'] === 'JobPosting' || (Array.isArray(obj['@type']) && obj['@type'].includes('JobPosting')))) {
        const job = {};

        // Title
        if (obj.title) job.title = String(obj.title).trim();

        // Company name
        if (obj.hiringOrganization && obj.hiringOrganization.name) {
          job.companyName = String(obj.hiringOrganization.name).trim();
        } else if (obj.employer && obj.employer.name) {
          job.companyName = String(obj.employer.name).trim();
        }

        // Description
        if (obj.description) job.description = String(obj.description).trim();

        // Location
        if (obj.jobLocation && obj.jobLocation.address && obj.jobLocation.address.addressLocality) {
          job.location = String(obj.jobLocation.address.addressLocality).trim();
        } else if (obj.jobLocation && typeof obj.jobLocation === 'string') {
          job.location = String(obj.jobLocation).trim();
        }

        // Employment type
        if (obj.employmentType) {
          const map = {
            'FULL_TIME': 'full_time',
            'PART_TIME': 'part_time',
            'CONTRACT': 'contract',
            'INTERNSHIP': 'internship',
            'TEMPORARY': 'contract',
            'REMOTE': 'remote'
          };
          const type = Array.isArray(obj.employmentType) ? obj.employmentType[0] : obj.employmentType;
          job.jobType = map[String(type).toUpperCase()] || String(type).toLowerCase();
        }

        // Source URL
        if (obj.url) job.sourceUrl = String(obj.url).trim();

        // Posted date
        if (obj.datePosted) job.postedDateIsoString = new Date(obj.datePosted).toISOString();

        // Application deadline
        if (obj.validThrough) job.deadlineIsoString = new Date(obj.validThrough).toISOString();

        // Salary
        if (obj.baseSalary) {
          const salary = obj.baseSalary;
          if (salary.value) {
            if (salary.value.minValue) job.salaryMin = Number(salary.value.minValue);
            if (salary.value.maxValue) job.salaryMax = Number(salary.value.maxValue);
            if (salary.value.currency) job.salaryCurrency = String(salary.value.currency);
          } else if (salary.minValue) {
            job.salaryMin = Number(salary.minValue);
            if (salary.maxValue) job.salaryMax = Number(salary.maxValue);
            if (salary.currency) job.salaryCurrency = String(salary.currency);
          }
        }

        // Only push if we have at least a title
        if (job.title) result.push(job);
      }
    };

    if (Array.isArray(json)) {
      json.forEach(item => processObj(item));
    } else {
      processObj(json);
    }
  } catch (e) {
    // ignore malformed JSON
  }
});

// Process each discovered container
containers.forEach($container => {
  const job = {};

  // Title extraction
  const titleEl = $container.find('h1, h2, .title, .job-title, .position, a').filter((_, el) => $(el).text().trim().length).first();
  if (titleEl.length) job.title = titleEl.text().trim();

  // Company name
  const compEl = $container.find('.company, .company-name, .employer, .org').first();
  if (compEl.length) job.companyName = compEl.text().trim();

  // Description
  const descEl = $container.find('.description, .job-description, .summary, p').first();
  if (descEl.length) job.description = descEl.text().trim();

  // Location
  const locEl = $container.find('.location, .job-location, .city, .place').first();
  if (locEl.length) job.location = locEl.text().trim();

  // Employment type
  const typeEl = $container.find('.type, .employment-type').first();
  if (typeEl.length) {
    const txt = typeEl.text().trim().toUpperCase();
    const map = {
      'FULL TIME': 'full_time',
      'FULL_TIME': 'full_time',
      'PART TIME': 'part_time',
      'PART_TIME': 'part_time',
      'CONTRACT': 'contract',
      'INTERNSHIP': 'internship',
      'REMOTE': 'remote'
    };
    job.jobType = map[txt] || txt.toLowerCase();
  }

  // Source URL – try to get from a link inside the container
  const linkEl = $container.find('a[href]').first();
  if (linkEl.length) job.sourceUrl = linkEl.attr('href');

  // Posted date
  const dateEl = $container.find('time[datetime], .date-posted, .posted').first();
  if (dateEl.length) {
    const dt = dateEl.attr('datetime') || dateEl.text();
    const iso = new Date(dt).toISOString();
    if (!isNaN(Date.parse(iso))) job.postedDateIsoString = iso;
  }

  // Deadline
  const deadlineEl = $container.find('.deadline, .apply-by, time[datetime][title*="deadline"]').first();
  if (deadlineEl.length) {
    const dt = deadlineEl.attr('datetime') || deadlineEl.text();
    const iso = new Date(dt).toISOString();
    if (!isNaN(Date.parse(iso))) job.deadlineIsoString = iso;
  }

  // Salary parsing – look for patterns like "$50k - $70k"
  const salaryEl = $container.find('.salary, .compensation').first();
  if (salaryEl.length) {
    const txt = salaryEl.text().replace(/[,]/g, '').trim();
    const match = txt.match(/([£$€])\s?(\d+(?:\.\d+)?)([kKmM]?)(?:\s*[-–]\s*([£$€])?\s?(\d+(?:\.\d+)?)([kKmM]?))?/);
    if (match) {
      const currency = match[1];
      const minVal = parseFloat(match[2]);
      const minUnit = match[3] ? match[3].toLowerCase() : '';
      const maxVal = match[5] ? parseFloat(match[5]) : null;
      const maxUnit = match[6] ? match[6].toLowerCase() : '';

      const factor = u => (u === 'k' ? 1e3 : u === 'm' ? 1e6 : 1);
      job.salaryCurrency = currency;
      job.salaryMin = Math.round(minVal * factor(minUnit));
      if (maxVal !== null) job.salaryMax = Math.round(maxVal * factor(maxUnit));
    }
  }

  // Only add if a clear title exists
  if (job.title) result.push(job);
});