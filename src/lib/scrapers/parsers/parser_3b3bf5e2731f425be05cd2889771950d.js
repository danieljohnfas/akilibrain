const scripts = $('script[type="application/ld+json"]');
scripts.each((i, el) => {
  let data;
  try {
    data = JSON.parse($(el).contents().text());
  } catch (e) {
    return;
  }
  const handle = obj => {
    if (!obj) return;
    const type = obj['@type'];
    const isJob = Array.isArray(type) ? type.includes('JobPosting') : type === 'JobPosting';
    if (!isJob) return;
    const job = {};
    if (obj.title) job.title = obj.title;
    else if (obj.name) job.title = obj.name;
    if (obj.hiringOrganization && obj.hiringOrganization.name) job.companyName = obj.hiringOrganization.name;
    if (obj.description) job.description = obj.description;
    if (obj.jobLocation && obj.jobLocation.address && obj.jobLocation.address.addressLocality) {
      job.location = obj.jobLocation.address.addressLocality;
    }
    if (obj.employmentType) {
      const et = obj.employmentType.toString().toLowerCase();
      if (et.includes('full')) job.jobType = 'full_time';
      else if (et.includes('part')) job.jobType = 'part_time';
      else if (et.includes('contract')) job.jobType = 'contract';
      else if (et.includes('intern')) job.jobType = 'internship';
      else if (et.includes('remote')) job.jobType = 'remote';
    }
    if (obj.url) job.sourceUrl = obj.url;
    if (obj.datePosted) job.postedDateIsoString = new Date(obj.datePosted).toISOString();
    if (obj.validThrough) job.deadlineIsoString = new Date(obj.validThrough).toISOString();
    if (obj.baseSalary) {
      const salary = obj.baseSalary;
      if (salary.value) {
        if (salary.value.minValue) job.salaryMin = Number(salary.value.minValue);
        if (salary.value.maxValue) job.salaryMax = Number(salary.value.maxValue);
        if (salary.value.currency) job.salaryCurrency = salary.value.currency;
      }
    }
    result.push(job);
  };
  if (Array.isArray(data)) {
    data.forEach(item => handle(item));
  } else {
    handle(data);
  }
});