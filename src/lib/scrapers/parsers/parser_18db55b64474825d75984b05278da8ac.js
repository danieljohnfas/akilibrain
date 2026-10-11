$('script[type="application/ld+json"]').each((i, el) => {
  try {
    const data = JSON.parse($(el).contents().text());
    const items = Array.isArray(data) ? data : [data];
    items.forEach(item => {
      if (item && item['@type'] === 'JobPosting') {
        const job = {};
        if (item.title) job.title = item.title;
        if (item.hiringOrganization && item.hiringOrganization.name) job.companyName = item.hiringOrganization.name;
        if (item.description) job.description = item.description;
        if (item.jobLocation && item.jobLocation.address && item.jobLocation.address.addressLocality) job.location = item.jobLocation.address.addressLocality;
        if (item.employmentType) {
          const type = item.employmentType.toString().toLowerCase();
          if (type.includes('full')) job.jobType = 'full_time';
          else if (type.includes('part')) job.jobType = 'part_time';
          else if (type.includes('contract')) job.jobType = 'contract';
          else if (type.includes('intern')) job.jobType = 'internship';
          else if (type.includes('remote')) job.jobType = 'remote';
        }
        if (item.url) job.sourceUrl = item.url;
        if (item.datePosted) job.postedDateIsoString = new Date(item.datePosted).toISOString();
        if (item.validThrough) job.deadlineIsoString = new Date(item.validThrough).toISOString();
        if (item.baseSalary && item.baseSalary.value) {
          const val = item.baseSalary.value;
          if (val.minValue != null) job.salaryMin = Number(val.minValue);
          if (val.maxValue != null) job.salaryMax = Number(val.maxValue);
          if (val.value != null && job.salaryMin == null && job.salaryMax == null) job.salaryMin = job.salaryMax = Number(val.value);
          if (item.baseSalary.currency) job.salaryCurrency = item.baseSalary.currency;
        }
        result.push(job);
      }
    });
  } catch (e) {}
});
$('.job-posting, .job, .career-item, article.job, li.job').each((i, el) => {
  const job = {};
  const $el = $(el);
  const title = $el.find('h1, h2, h3, .title, .job-title').first().text().trim();
  if (!title) return;
  job.title = title;
  const company = $el.find('.company, .company-name').first().text().trim();
  if (company) job.companyName = company;
  const desc = $el.find('.description, .job-description, p').first().text().trim();
  if (desc) job.description = desc;
  const loc = $el.find('.location, .job-location').first().text().trim();
  if (loc) job.location = loc;
  const type = $el.find('.type, .employment-type').first().text().toLowerCase();
  if (type.includes('full')) job.jobType = 'full_time';
  else if (type.includes('part')) job.jobType = 'part_time';
  else if (type.includes('contract')) job.jobType = 'contract';
  else if (type.includes('intern')) job.jobType = 'internship';
  else if (type.includes('remote')) job.jobType = 'remote';
  const link = $el.find('a').first().attr('href');
  if (link) job.sourceUrl = link;
  result.push(job);
});