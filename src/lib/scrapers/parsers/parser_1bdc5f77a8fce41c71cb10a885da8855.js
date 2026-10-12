let jsonScripts = $('script[type="application/ld+json"]');
jsonScripts.each(function () {
  try {
    let data = JSON.parse($(this).contents().text());
    if (Array.isArray(data)) {
      data.forEach(processItem);
    } else {
      processItem(data);
    }
  } catch (e) {}
});

function processItem(item) {
  if (!item) return;
  let type = item['@type'];
  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) {
    let job = {};
    job.title = item.title || item.headline || '';
    job.companyName =
      (item.hiringOrganization && item.hiringOrganization.name) || '';
    job.description = item.description || '';
    if (item.jobLocation && item.jobLocation.address) {
      let addr = item.jobLocation.address;
      job.location =
        addr.addressLocality ||
        addr.streetAddress ||
        addr.addressRegion ||
        addr.addressCountry ||
        '';
    } else {
      job.location = '';
    }
    let jt = item.employmentType;
    if (Array.isArray(jt)) jt = jt[0];
    if (jt) {
      jt = jt.toString().toLowerCase();
      if (jt.includes('full')) job.jobType = 'full_time';
      else if (jt.includes('part')) job.jobType = 'part_time';
      else if (jt.includes('contract')) job.jobType = 'contract';
      else if (jt.includes('intern')) job.jobType = 'internship';
      else if (jt.includes('remote')) job.jobType = 'remote';
      else job.jobType = jt;
    } else {
      job.jobType = '';
    }
    job.sourceUrl = item.url || '';
    job.postedDateIsoString = item.datePosted || '';
    job.deadlineIsoString = item.validThrough || '';
    if (item.baseSalary && item.baseSalary.value) {
      let val = item.baseSalary.value;
      job.salaryMin = val.minValue != null ? Number(val.minValue) : null;
      job.salaryMax = val.maxValue != null ? Number(val.maxValue) : null;
      job.salaryCurrency = val.currency || '';
    } else {
      job.salaryMin = null;
      job.salaryMax = null;
      job.salaryCurrency = '';
    }
    result.push(job);
  }
}