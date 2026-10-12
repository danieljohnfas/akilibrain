let jobContainers = $('.job, .job-item, .vacancy, .career-item, .listing-item, .post, .job-listing, .position, .opening, .posting');

jobContainers.each((_, container) => {
  const $container = $(container);
  const title = $container.find('h1, h2, h3, .title, .job-title, a').first().text().trim();
  if (!title) return;

  const job = { title };

  const company = $container.find('.company, .company-name, .employer').first().text().trim();
  if (company) job.companyName = company;

  const description = $container.find('.description, .job-description, p').text().trim();
  if (description) job.description = description;

  const location = $container.find('.location, .job-location, .city').first().text().trim();
  if (location) job.location = location;

  const typeText = $container.find('.type, .job-type').first().text().toLowerCase().trim();
  if (typeText) {
    if (typeText.includes('full')) job.jobType = 'full_time';
    else if (typeText.includes('part')) job.jobType = 'part_time';
    else if (typeText.includes('contract')) job.jobType = 'contract';
    else if (typeText.includes('intern')) job.jobType = 'internship';
    else if (typeText.includes('remote')) job.jobType = 'remote';
  }

  const sourceLink = $container.find('a[href]').first().attr('href');
  if (sourceLink) job.sourceUrl = sourceLink;

  const posted = $container.find('.posted, .date-posted, time[datetime]').first().attr('datetime') ||
                 $container.find('.posted, .date-posted').first().text().trim();
  if (posted) {
    const iso = new Date(posted).toISOString();
    if (!isNaN(Date.parse(iso))) job.postedDateIsoString = iso;
  }

  const deadline = $container.find('.deadline, .apply-by, time[datetime][class*="deadline"]').first().attr('datetime') ||
                   $container.find('.deadline, .apply-by').first().text().trim();
  if (deadline) {
    const iso = new Date(deadline).toISOString();
    if (!isNaN(Date.parse(iso))) job.deadlineIsoString = iso;
  }

  const salaryText = $container.find('.salary, .compensation').first().text().trim();
  if (salaryText) {
    const salaryMatch = salaryText.replace(/,/g, '').match(/([A-Z]{3})?\s*([\d]+)(?:\s*-\s*([\d]+))?/);
    if (salaryMatch) {
      if (salaryMatch[1]) job.salaryCurrency = salaryMatch[1];
      job.salaryMin = Number(salaryMatch[2]) || undefined;
      if (salaryMatch[3]) job.salaryMax = Number(salaryMatch[3]) || undefined;
    }
  }

  result.push(job);
});