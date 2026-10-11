const ldScripts = $('script[type="application/ld+json"]');
ldScripts.each((_, el) => {
  try {
    const data = JSON.parse($(el).contents().text());
    const items = Array.isArray(data) ? data : [data];
    items.forEach(item => {
      if (item['@type'] === 'JobPosting') {
        const job = {};
        if (item.title) job.title = item.title;
        if (item.hiringOrganization && item.hiringOrganization.name) job.companyName = item.hiringOrganization.name;
        if (item.description) job.description = item.description;
        if (item.jobLocation && item.jobLocation.address) {
          const addr = item.jobLocation.address;
          const parts = [];
          if (addr.addressLocality) parts.push(addr.addressLocality);
          if (addr.addressRegion) parts.push(addr.addressRegion);
          if (addr.addressCountry) parts.push(addr.addressCountry);
          if (parts.length) job.location = parts.join(', ');
        }
        if (item.employmentType) {
          const type = item.employmentType.toString().toLowerCase();
          if (type.includes('full')) job.jobType = 'full_time';
          else if (type.includes('part')) job.jobType = 'part_time';
          else if (type.includes('contract')) job.jobType = 'contract';
          else if (type.includes('intern')) job.jobType = 'internship';
          else if (type.includes('remote')) job.jobType = 'remote';
        }
        if (item.sameAs) job.sourceUrl = item.sameAs;
        else if (item.url) job.sourceUrl = item.url;
        if (item.datePosted) job.postedDateIsoString = new Date(item.datePosted).toISOString();
        if (item.validThrough) job.deadlineIsoString = new Date(item.validThrough).toISOString();
        if (item.baseSalary && item.baseSalary.value) {
          const val = item.baseSalary.value;
          if (val.minValue) job.salaryMin = Number(val.minValue);
          if (val.maxValue) job.salaryMax = Number(val.maxValue);
          if (val.currency) job.salaryCurrency = val.currency;
        }
        result.push(job);
      }
    });
  } catch (e) {}
});
if (result.length === 0) {
  $('.job, .job-listing, .position, .career-item, .listing-item').each((_, el) => {
    const $el = $(el);
    const title = $el.find('h1, h2, h3, .title, .job-title').first().text().trim();
    if (!title) return;
    const job = { title };
    const company = $el.find('.company, .company-name').first().text().trim();
    if (company) job.companyName = company;
    const desc = $el.find('.description, .job-description, p').first().text().trim();
    if (desc) job.description = desc;
    const loc = $el.find('.location, .job-location').first().text().trim();
    if (loc) job.location = loc;
    const typeText = $el.find('.type, .employment-type').first().text().toLowerCase();
    if (typeText) {
      if (typeText.includes('full')) job.jobType = 'full_time';
      else if (typeText.includes('part')) job.jobType = 'part_time';
      else if (typeText.includes('contract')) job.jobType = 'contract';
      else if (typeText.includes('intern')) job.jobType = 'internship';
      else if (typeText.includes('remote')) job.jobType = 'remote';
    }
    const link = $el.find('a[href]').first().attr('href');
    if (link) job.sourceUrl = link;
    result.push(job);
  });
}