const containers = $('.job-card, .job-item, .job-listing, .listing-item, .job-post, article[data-schema-type="JobPosting"]');
containers.each(function () {
  const el = $(this);
  const title = el.find('h1, h2, h3, .title, .job-title').first().text().trim();
  if (!title) return;
  const job = { title };
  const company = el.find('.company, .company-name').first().text().trim();
  if (company) job.companyName = company;
  const description = el.find('.description, .job-desc, p').first().text().trim();
  if (description) job.description = description;
  const location = el.find('.location, .job-location').first().text().trim();
  if (location) job.location = location;
  const typeText = el.find('.type, .job-type').first().text().toLowerCase();
  if (typeText) {
    if (/full\s?time/.test(typeText)) job.jobType = 'full_time';
    else if (/part\s?time/.test(typeText)) job.jobType = 'part_time';
    else if (/contract/.test(typeText)) job.jobType = 'contract';
    else if (/intern/.test(typeText)) job.jobType = 'internship';
    else if (/remote/.test(typeText)) job.jobType = 'remote';
  }
  const url = el.find('a[href]').first().attr('href');
  if (url) job.sourceUrl = url;
  const posted = el.find('time[datetime]').first().attr('datetime');
  if (posted) job.postedDateIsoString = new Date(posted).toISOString();
  const deadline = el.find('.deadline time[datetime]').first().attr('datetime');
  if (deadline) job.deadlineIsoString = new Date(deadline).toISOString();
  const salaryText = el.find('.salary, .salary-range').first().text().trim();
  if (salaryText) {
    const m = salaryText.replace(/,/g, '').match(/([A-Z]{3})\s?(\d+)(?:\s?-\s?(\d+))?/);
    if (m) {
      job.salaryCurrency = m[1];
      job.salaryMin = Number(m[2]);
      if (m[3]) job.salaryMax = Number(m[3]);
    }
  }
  result.push(job);
});