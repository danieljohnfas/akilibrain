const jobContainers = $('.job-listing, .job-item, .job-post, [type="JobPosting"], article[data-schema-type="JobPosting"]');

jobContainers.each((_, el) => {
  const $el = $(el);
  const title = $el.find('.job-title, h1, h2, .title').first().text().trim();
  if (!title) return;
  const job = { title };
  const company = $el.find('.company-name, .company').first().text().trim();
  if (company) job.companyName = company;
  const description = $el.find('.job-description, .description, p').first().text().trim();
  if (description) job.description = description;
  const location = $el.find('.location, .job-location').first().text().trim();
  if (location) job.location = location;
  const typeText = $el.find('.job-type, .type').first().text().trim().toLowerCase();
  if (typeText) {
    if (typeText.includes('full')) job.jobType = 'full_time';
    else if (typeText.includes('part')) job.jobType = 'part_time';
    else if (typeText.includes('contract')) job.jobType = 'contract';
    else if (typeText.includes('intern')) job.jobType = 'internship';
    else if (typeText.includes('remote')) job.jobType = 'remote';
  }
  const url = $el.find('a.apply-link, a').first().attr('href');
  if (url) job.sourceUrl = url;
  const posted = $el.find('time.posted, .posted-date').first().attr('datetime') || $el.find('time.posted, .posted-date').first().text().trim();
  if (posted) job.postedDateIsoString = new Date(posted).toISOString();
  const deadline = $el.find('time.deadline, .deadline-date').first().attr('datetime') || $el.find('time.deadline, .deadline-date').first().text().trim();
  if (deadline) job.deadlineIsoString = new Date(deadline).toISOString();
  const salaryText = $el.find('.salary, .compensation').first().text().trim();
  if (salaryText) {
    const match = salaryText.replace(/,/g, '').match(/([A-Z]{3})?\s*([\d]+)(?:\s*-\s*([\d]+))?/i);
    if (match) {
      if (match[1]) job.salaryCurrency = match[1];
      job.salaryMin = Number(match[2]) || undefined;
      if (match[3]) job.salaryMax = Number(match[3]);
    }
  }
  result.push(job);
});