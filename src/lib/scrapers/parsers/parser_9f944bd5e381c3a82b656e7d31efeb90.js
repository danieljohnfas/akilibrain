// Extract jobs from JSON‑LD JobPosting objects
$('script[type="application/ld+json"]').each(function () {
  let data;
  try {
    data = JSON.parse($(this).contents().text());
  } catch (e) {
    return;
  }
  const items = Array.isArray(data) ? data : [data];
  items.forEach(function (item) {
    const extract = function (obj) {
      if (!obj) return;
      if (obj['@type'] === 'JobPosting' || (Array.isArray(obj['@type']) && obj['@type'].includes('JobPosting'))) {
        const job = {};
        if (obj.title) job.title = String(obj.title).trim();
        else if (obj.name) job.title = String(obj.name).trim();
        if (obj.hiringOrganization && obj.hiringOrganization.name) job.companyName = String(obj.hiringOrganization.name).trim();
        if (obj.description) job.description = String(obj.description).trim();
        if (obj.jobLocation && obj.jobLocation.address) {
          const addr = obj.jobLocation.address;
          const parts = [];
          if (addr.streetAddress) parts.push(addr.streetAddress);
          if (addr.addressLocality) parts.push(addr.addressLocality);
          if (addr.addressRegion) parts.push(addr.addressRegion);
          if (addr.addressCountry) parts.push(addr.addressCountry);
          job.location = parts.join(', ');
        }
        if (obj.employmentType) {
          const et = String(obj.employmentType).toLowerCase();
          if (et.includes('full')) job.jobType = 'full_time';
          else if (et.includes('part')) job.jobType = 'part_time';
          else if (et.includes('contract')) job.jobType = 'contract';
          else if (et.includes('intern')) job.jobType = 'internship';
          else if (et.includes('remote')) job.jobType = 'remote';
          else job.jobType = et;
        }
        if (obj.url) job.sourceUrl = String(obj.url).trim();
        if (obj.datePosted) job.postedDateIsoString = String(obj.datePosted).trim();
        if (obj.validThrough) job.deadlineIsoString = String(obj.validThrough).trim();
        if (obj.baseSalary) {
          const sal = obj.baseSalary;
          if (sal.currency) job.salaryCurrency = String(sal.currency).trim();
          if (sal.value) {
            if (typeof sal.value === 'object') {
              if (sal.value.minValue) job.salaryMin = Number(sal.value.minValue);
              if (sal.value.maxValue) job.salaryMax = Number(sal.value.maxValue);
              if (sal.value.currency) job.salaryCurrency = String(sal.value.currency).trim();
            } else {
              const num = Number(sal.value);
              if (!isNaN(num)) {
                job.salaryMin = num;
                job.salaryMax = num;
              }
            }
          }
        }
        if (job.title) result.push(job);
      }
      // Recursively search nested objects/arrays
      if (typeof obj === 'object') {
        Object.values(obj).forEach(function (v) {
          if (Array.isArray(v) || (v && typeof v === 'object')) extract(v);
        });
      }
    };
    extract(item);
  });
});

// Fallback DOM scraping if no JSON‑LD jobs were found
if (result.length === 0) {
  const containers = $('.job, .vacancy, .job-listing, .listing, article.post, .post, .entry-content li');
  containers.each(function () {
    const $c = $(this);
    const titleEl = $c.find('h1, h2, h3, a').first();
    const title = titleEl.text().trim();
    if (!title) return;
    const job = { title };
    const companyEl = $c.find('.company, .company-name, .employer').first();
    if (companyEl.length) job.companyName = companyEl.text().trim();
    const descEl = $c.find('.description, .job-description, p').first();
    if (descEl.length) job.description = descEl.text().trim();
    const locEl = $c.find('.location, .job-location').first();
    if (locEl.length) job.location = locEl.text().trim();
    const typeEl = $c.find('.type, .employment-type').first();
    if (typeEl.length) {
      const t = typeEl.text().toLowerCase();
      if (t.includes('full')) job.jobType = 'full_time';
      else if (t.includes('part')) job.jobType = 'part_time';
      else if (t.includes('contract')) job.jobType = 'contract';
      else if (t.includes('intern')) job.jobType = 'internship';
      else if (t.includes('remote')) job.jobType = 'remote';
    }
    const linkEl = $c.find('a[href]').first();
    if (linkEl.length) job.sourceUrl = linkEl.attr('href');
    // Dates & salary are rarely present in simple listings; skip if not found
    result.push(job);
  });
}