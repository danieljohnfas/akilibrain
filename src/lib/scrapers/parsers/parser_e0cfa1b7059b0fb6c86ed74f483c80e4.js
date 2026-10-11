const jobScripts = $('script[type="application/ld+json"]');
jobScripts.each((_, elem) => {
  let data;
  try {
    data = JSON.parse($(elem).contents().first().text());
  } catch (e) {
    return;
  }
  const postings = Array.isArray(data) ? data : [data];
  postings.forEach(item => {
    if (item['@type'] !== 'JobPosting') return;
    const job = {};
    if (item.title) job.title = String(item.title).trim();
    if (item.hiringOrganization && item.hiringOrganization.name) job.companyName = String(item.hiringOrganization.name).trim();
    if (item.description) job.description = String(item.description).trim();
    if (item.jobLocation && item.jobLocation.address && item.jobLocation.address.addressLocality) {
      job.location = String(item.jobLocation.address.addressLocality).trim();
    }
    if (item.employmentType) {
      const type = String(item.employmentType).toLowerCase();
      if (type.includes('full')) job.jobType = 'full_time';
      else if (type.includes('part')) job.jobType = 'part_time';
      else if (type.includes('contract')) job.jobType = 'contract';
      else if (type.includes('intern')) job.jobType = 'internship';
      else if (type.includes('remote')) job.jobType = 'remote';
    }
    if (item.url) job.sourceUrl = String(item.url).trim();
    if (item.datePosted) job.postedDateIsoString = String(item.datePosted).trim();
    if (item.validThrough) job.deadlineIsoString = String(item.validThrough).trim();
    if (item.baseSalary) {
      const salary = item.baseSalary;
      if (salary.value && salary.value.minValue != null) job.salaryMin = Number(salary.value.minValue);
      if (salary.value && salary.value.maxValue != null) job.salaryMax = Number(salary.value.maxValue);
      if (salary.currency) job.salaryCurrency = String(salary.currency).trim();
    }
    result.push(job);
  });
});

if (!result.length) {
  const jobContainers = $('.job, .job-listing, .job-item, .posting, .career-item, .vacancy, [data-job-id]');
  jobContainers.each((_, el) => {
    const $el = $(el);
    const title = $el.find('h1, h2, .title, .job-title').first().text().trim();
    if (!title) return;
    const job = { title };
    const company = $el.find('.company, .company-name').first().text().trim();
    if (company) job.companyName = company;
    const location = $el.find('.location, .job-location').first().text().trim();
    if (location) job.location = location;
    const desc = $el.find('.description, .job-description, p').first().text().trim();
    if (desc) job.description = desc;
    const typeText = $el.find('.type, .job-type').first().text().toLowerCase();
    if (typeText) {
      if (typeText.includes('full')) job.jobType = 'full_time';
      else if (typeText.includes('part')) job.jobType = 'part_time';
      else if (typeText.includes('contract')) job.jobType = 'contract';
      else if (typeText.includes('intern')) job.jobType = 'internship';
      else if (typeText.includes('remote')) job.jobType = 'remote';
    }
    const salary = $el.find('.salary').first().text();
    if (salary) {
      const match = salary.replace(/[,]/g, '').match(/([A-Z]{3})?\s?(\d+(?:\.\d+)?)/i);
      if (match) {
        if (match[1]) job.salaryCurrency = match[1];
        job.salaryMin = Number(match[2]);
      }
    }
    const link = $el.find('a').first().attr('href');
    if (link) job.sourceUrl = link;
    result.push(job);
  });
}