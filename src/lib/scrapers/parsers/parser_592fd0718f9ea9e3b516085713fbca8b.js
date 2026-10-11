// Find all JSON‑LD scripts and parse possible JobPosting objects
$('script[type="application/ld+json"]').each((_, script) => {
  let json;
  try {
    json = JSON.parse($(script).contents().text());
  } catch (e) {
    return;
  }

  const candidates = [];

  // Helper to push any JobPosting found in a value
  const collect = (obj) => {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach(collect);
    } else if (typeof obj === 'object') {
      const type = obj['@type'];
      if (type) {
        if (Array.isArray(type) ? type.includes('JobPosting') : type === 'JobPosting') {
          candidates.push(obj);
        }
      }
      // Dive into possible nested structures (e.g., @graph)
      Object.values(obj).forEach(collect);
    }
  };

  collect(json);

  candidates.forEach((job) => {
    const jobObj = {};

    // Title
    if (job.title) jobObj.title = String(job.title).trim();
    else if (job.name) jobObj.title = String(job.name).trim();

    // Company
    if (job.hiringOrganization && job.hiringOrganization.name) {
      jobObj.companyName = String(job.hiringOrganization.name).trim();
    }

    // Description
    if (job.description) jobObj.description = String(job.description).trim();

    // Location (concatenate parts if available)
    if (job.jobLocation && job.jobLocation.length) {
      const addr = job.jobLocation[0].address || {};
      const parts = [
        addr.streetAddress,
        addr.addressLocality,
        addr.addressRegion,
        addr.postalCode,
        addr.addressCountry,
      ].filter(Boolean);
      if (parts.length) jobObj.location = parts.join(', ');
    }

    // Employment type mapping
    if (job.employmentType) {
      const et = String(job.employmentType).toLowerCase();
      if (et.includes('full')) jobObj.jobType = 'full_time';
      else if (et.includes('part')) jobObj.jobType = 'part_time';
      else if (et.includes('contract')) jobObj.jobType = 'contract';
      else if (et.includes('intern')) jobObj.jobType = 'internship';
      else if (et.includes('remote')) jobObj.jobType = 'remote';
      else jobObj.jobType = et;
    }

    // URLs and dates
    if (job.url) jobObj.sourceUrl = String(job.url).trim();
    if (job.datePosted) jobObj.postedDateIsoString = String(job.datePosted).trim();
    if (job.validThrough) jobObj.deadlineIsoString = String(job.validThrough).trim();

    // Salary parsing
    const salary = job.baseSalary;
    if (salary && typeof salary === 'object') {
      if (salary.value) {
        const val = salary.value;
        if (typeof val === 'object') {
          if (val.minValue) jobObj.salaryMin = Number(val.minValue);
          if (val.maxValue) jobObj.salaryMax = Number(val.maxValue);
          if (val.currency) jobObj.salaryCurrency = String(val.currency);
        } else if (!isNaN(Number(val))) {
          jobObj.salaryMin = jobObj.salaryMax = Number(val);
        }
      } else {
        if (salary.minValue) jobObj.salaryMin = Number(salary.minValue);
        if (salary.maxValue) jobObj.salaryMax = Number(salary.maxValue);
        if (salary.currency) jobObj.salaryCurrency = String(salary.currency);
      }
    }

    // Only push if a clear title exists (avoid false positives)
    if (jobObj.title) result.push(jobObj);
  });
});