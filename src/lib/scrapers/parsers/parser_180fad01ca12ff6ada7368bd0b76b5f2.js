// Find all JSON‑LD scripts
$('script[type="application/ld+json"]').each((_, script) => {
  let data;
  try {
    data = JSON.parse($(script).contents().text());
  } catch (e) {
    return;
  }
  // Helper to walk through possible graph structures
  const candidates = [];
  if (Array.isArray(data)) {
    candidates.push(...data);
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data['@graph'])) {
      candidates.push(...data['@graph']);
    } else {
      candidates.push(data);
    }
  }

  candidates.forEach(item => {
    // Some items may have @type as array
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

    // Description (strip possible HTML)
    if (item.description) {
      const desc = String(item.description).replace(/<[^>]*>/g, '').trim();
      job.description = desc;
    }

    // Location
    if (item.jobLocation && item.jobLocation.address) {
      const addr = item.jobLocation.address;
      const parts = [];
      if (addr.streetAddress) parts.push(addr.streetAddress);
      if (addr.addressLocality) parts.push(addr.addressLocality);
      if (addr.addressRegion) parts.push(addr.addressRegion);
      if (addr.addressCountry) parts.push(addr.addressCountry);
      if (parts.length) job.location = parts.join(', ');
    }

    // Employment type mapping
    if (item.employmentType) {
      const et = String(item.employmentType).toLowerCase();
      if (et.includes('full')) job.jobType = 'full_time';
      else if (et.includes('part')) job.jobType = 'part_time';
      else if (et.includes('contract')) job.jobType = 'contract';
      else if (et.includes('intern')) job.jobType = 'internship';
      else if (et.includes('remote')) job.jobType = 'remote';
    }

    // Source URL
    if (item.url) job.sourceUrl = String(item.url).trim();
    else {
      const ogUrl = $('meta[property="og:url"]').attr('content');
      if (ogUrl) job.sourceUrl = ogUrl.trim();
    }

    // Dates
    if (item.datePosted) job.postedDateIsoString = String(item.datePosted).trim();
    if (item.validThrough) job.deadlineIsoString = String(item.validThrough).trim();

    // Salary handling
    if (item.baseSalary) {
      const salary = item.baseSalary;
      // Structured salary object
      if (salary.value) {
        const val = salary.value;
        if (typeof val === 'object') {
          if (val.minValue != null) job.salaryMin = Number(val.minValue);
          if (val.maxValue != null) job.salaryMax = Number(val.maxValue);
          if (val.currency) job.salaryCurrency = String(val.currency).trim();
        } else if (!isNaN(val)) {
          job.salaryMin = job.salaryMax = Number(val);
        }
      } else if (typeof salary === 'object') {
        if (salary.minValue != null) job.salaryMin = Number(salary.minValue);
        if (salary.maxValue != null) job.salaryMax = Number(salary.maxValue);
        if (salary.currency) job.salaryCurrency = String(salary.currency).trim();
      } else if (!isNaN(salary)) {
        job.salaryMin = job.salaryMax = Number(salary);
      }
    }

    result.push(job);
  });
});