let scripts = $('script[type="application/ld+json"]');
scripts.each((_, el) => {
  try {
    let jsonText = $(el).contents().text().trim();
    if (!jsonText) return;
    let data = JSON.parse(jsonText);
    if (Array.isArray(data)) {
      data.forEach(item => processItem(item));
    } else {
      processItem(data);
    }
  } catch (e) {}
});

function processItem(item) {
  if (!item || (item['@type'] !== 'JobPosting' && !(Array.isArray(item['@type']) && item['@type'].includes('JobPosting')))) return;

  let job = {};

  // Title
  job.title = item.title || item.name || '';

  // Company
  if (item.hiringOrganization && typeof item.hiringOrganization === 'object') {
    job.companyName = item.hiringOrganization.name || '';
  } else {
    job.companyName = '';
  }

  // Description
  job.description = item.description || '';

  // Location
  if (item.jobLocation && item.jobLocation.address) {
    let addr = item.jobLocation.address;
    job.location = addr.addressLocality || addr.streetAddress || addr.addressRegion || '';
  } else {
    job.location = '';
  }

  // Job type
  if (item.employmentType) {
    let type = Array.isArray(item.employmentType) ? item.employmentType[0] : item.employmentType;
    job.jobType = type.toString().toLowerCase().replace(/\s+/g, '_');
  } else {
    job.jobType = '';
  }

  // Source URL
  job.sourceUrl = item.url || item.sameAs || '';

  // Dates
  if (item.datePosted) {
    let d = new Date(item.datePosted);
    if (!isNaN(d)) job.postedDateIsoString = d.toISOString();
  }
  if (item.validThrough) {
    let d = new Date(item.validThrough);
    if (!isNaN(d)) job.deadlineIsoString = d.toISOString();
  }

  // Salary
  if (item.baseSalary && typeof item.baseSalary === 'object') {
    let sal = item.baseSalary;
    job.salaryCurrency = sal.currency || '';
    if (sal.value) {
      if (typeof sal.value === 'object') {
        if (sal.value.minValue != null) job.salaryMin = Number(sal.value.minValue) || null;
        if (sal.value.maxValue != null) job.salaryMax = Number(sal.value.maxValue) || null;
      } else {
        job.salaryMin = Number(sal.value) || null;
      }
    }
  }

  result.push(job);
}