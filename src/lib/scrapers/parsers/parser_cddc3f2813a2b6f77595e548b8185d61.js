// Extract JobPosting data from JSON‑LD scripts
$('script[type="application/ld+json"]').each((_, el) => {
  let data;
  try {
    data = JSON.parse($(el).contents().first().text());
  } catch (e) {
    return;
  }
  const items = Array.isArray(data) ? data : [data];
  items.forEach(item => {
    const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
    if (!types.includes('JobPosting')) return;

    const job = {};

    // Title
    if (item.title) job.title = String(item.title).trim();
    else if (item.name) job.title = String(item.name).trim();

    // Company
    if (item.hiringOrganization && item.hiringOrganization.name) {
      job.companyName = String(item.hiringOrganization.name).trim();
    }

    // Description
    if (item.description) job.description = String(item.description).trim();

    // Location
    if (item.jobLocation && item.jobLocation.address) {
      const addr = item.jobLocation.address;
      const parts = [];
      if (addr.addressLocality) parts.push(addr.addressLocality);
      if (addr.addressRegion) parts.push(addr.addressRegion);
      if (addr.addressCountry) parts.push(addr.addressCountry);
      job.location = parts.join(', ');
    }

    // Job type
    if (item.employmentType) {
      const map = {
        'FULL_TIME': 'full_time',
        'PART_TIME': 'part_time',
        'CONTRACT': 'contract',
        'INTERNSHIP': 'internship',
        'TEMPORARY': 'contract',
        'REMOTE': 'remote'
      };
      const typeKey = String(item.employmentType).toUpperCase();
      job.jobType = map[typeKey] || typeKey.toLowerCase();
    }

    // Source URL
    if (item.sameAs) job.sourceUrl = String(item.sameAs).trim();
    else if (item.url) job.sourceUrl = String(item.url).trim();

    // Dates
    if (item.datePosted) job.postedDateIsoString = new Date(item.datePosted).toISOString();
    if (item.validThrough) job.deadlineIsoString = new Date(item.validThrough).toISOString();

    // Salary
    if (item.baseSalary) {
      const salary = item.baseSalary;
      // Structured salary object
      if (salary.value && typeof salary.value === 'object') {
        if (salary.value.minValue) {
          job.salaryMin = Number(salary.value.minValue);
        }
        if (salary.value.maxValue) {
          job.salaryMax = Number(salary.value.maxValue);
        }
        if (salary.value.currency) {
          job.salaryCurrency = String(salary.value.currency).trim();
        }
      } else if (typeof salary === 'object') {
        if (salary.minValue) job.salaryMin = Number(salary.minValue);
        if (salary.maxValue) job.salaryMax = Number(salary.maxValue);
        if (salary.currency) job.salaryCurrency = String(salary.currency).trim();
      }
    }

    // Only push if we have a clear title
    if (job.title) result.push(job);
  });
});

// If no jobs were found in JSON‑LD, fall back to DOM parsing
if (result.length === 0) {
  const containers = $('article, .job, .job-listing, .listing-item, .post, .entry-content')
    .filter((_, el) => {
      const $el = $(el);
      // Heuristic: must contain a title element
      return $el.find('h1, h2, h3, .job-title, .title, a.title').length > 0;
    });

  containers.each((_, el) => {
    const $c = $(el);
    const job = {};

    // Title
    const $title = $c.find('h1, h2, h3, .job-title, .title, a.title').first();
    job.title = $title.text().trim();

    if (!job.title) return; // not a real job listing

    // Company name
    const $company = $c.find('.company, .company-name, .employer, .org-name').first();
    if ($company.length) job.companyName = $company.text().trim();

    // Location
    const $loc = $c.find('.location, .job-location, .address').first();
    if ($loc.length) job.location = $loc.text().trim();

    // Description (take first paragraph or dedicated description block)
    const $desc = $c.find('.job-description, .description, p').first();
    if ($desc.length) job.description = $desc.text().trim();

    // Job type
    const $type = $c.find('.job-type, .employment-type').first();
    if ($type.length) {
      const typeRaw = $type.text().trim().toLowerCase();
      const map = {
        'full time': 'full_time',
        'full-time': 'full_time',
        'part time': 'part_time',
        'part-time': 'part_time',
        'contract': 'contract',
        'internship': 'internship',
        'remote': 'remote'
      };
      job.jobType = map[typeRaw] || typeRaw.replace(/\s+/g, '_');
    }

    // Source URL
    const $link = $c.find('a.title, a[href]').first();
    if ($link.length) {
      const href = $link.attr('href');
      if (href) job.sourceUrl = href.trim();
    }

    // Posted date
    const $posted = $c.find('time[datetime], .date-posted').first();
    if ($posted.length) {
      const datetime = $posted.attr('datetime') || $posted.text();
      if (datetime) job.postedDateIsoString = new Date(datetime).toISOString();
    }

    // Deadline date
    const $deadline = $c.find('.deadline, time[datetime][class*="deadline"]').first();
    if ($deadline.length) {
      const datetime = $deadline.attr('datetime') || $deadline.text();
      if (datetime) job.deadlineIsoString = new Date(datetime).toISOString();
    }

    // Salary parsing (simple numeric extraction)
    const $salary = $c.find('.salary, .pay, .compensation').first();
    if ($salary.length) {
      const salaryText = $salary.text();
      const currencyMatch = salaryText.match(/([A-Z]{3}|[$€£])\s?([\d,]+)/);
      if (currencyMatch) {
        job.salaryCurrency = currencyMatch[1];
        const amount = Number(currencyMatch[2].replace(/,/g, ''));
        if (!isNaN(amount)) {
          job.salaryMin = amount;
          job.salaryMax = amount;
        }
      } else {
        // Try range like "5000 - 7000 USD"
        const rangeMatch = salaryText.match(/([\d,]+)\s*[-–]\s*([\d,]+)\s*([A-Z]{3}|[$€£])/i);
        if (rangeMatch) {
          job.salaryMin = Number(rangeMatch[1].replace(/,/g, ''));
          job.salaryMax = Number(rangeMatch[2].replace(/,/g, ''));
          job.salaryCurrency = rangeMatch[3];
        }
      }
    }

    result.push(job);
  });
}