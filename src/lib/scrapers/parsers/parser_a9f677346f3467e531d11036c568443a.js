const jobContainers = $('div.job, div.job-item, div.listing, li.job, article.job, .card, .col-md-6 .card');

jobContainers.each((_, el) => {
  const container = $(el);

  let title = container.find('h1, h2, h3').first().text().trim();
  if (!title) title = container.find('a').first().text().trim();
  if (!title) return;

  const job = { title };

  const company = container.find('.company, .company-name, .employer').first().text().trim();
  if (company) job.companyName = company;

  const description = container.find('.description, .job-description, p').first().text().trim();
  if (description) job.description = description;

  const location = container.find('.location, .job-location').first().text().trim();
  if (location) job.location = location;

  const typeText = container.find('.job-type, .type').first().text().toLowerCase();
  if (typeText) {
    if (/full[-\s]?time/.test(typeText)) job.jobType = 'full_time';
    else if (/part[-\s]?time/.test(typeText)) job.jobType = 'part_time';
    else if (/contract/.test(typeText)) job.jobType = 'contract';
    else if (/intern/.test(typeText)) job.jobType = 'internship';
    else if (/remote/.test(typeText)) job.jobType = 'remote';
  }

  const sourceLink = container.find('a[href*="/job/"]').first().attr('href');
  if (sourceLink) {
    job.sourceUrl = sourceLink.startsWith('http')
      ? sourceLink
      : new URL(sourceLink, 'https://api.ekazi.co.tz').href;
  }

  const postedRaw = container.find('time[datetime], .posted, .date-posted').first().attr('datetime') ||
                    container.find('.posted, .date-posted').first().text().trim();
  if (postedRaw) {
    const postedDate = new Date(postedRaw);
    if (!isNaN(postedDate)) job.postedDateIsoString = postedDate.toISOString();
  }

  const deadlineRaw = container.find('time[datetime][class*="deadline"], .deadline, .apply-by').first().attr('datetime') ||
                      container.find('.deadline, .apply-by').first().text().trim();
  if (deadlineRaw) {
    const deadlineDate = new Date(deadlineRaw);
    if (!isNaN(deadlineDate)) job.deadlineIsoString = deadlineDate.toISOString();
  }

  const salaryText = container.find('.salary, .salary-range').first().text().trim();
  if (salaryText) {
    const rangeMatch = salaryText.match(/([A-Z]{3})?\s*([\d,]+)\s*(?:-|\s+to\s+)\s*([A-Z]{3})?\s*([\d,]+)/i);
    if (rangeMatch) {
      job.salaryCurrency = (rangeMatch[1] || rangeMatch[3] || '').toUpperCase();
      job.salaryMin = Number(rangeMatch[2].replace(/,/g, ''));
      job.salaryMax = Number(rangeMatch[4].replace(/,/g, ''));
    } else {
      const singleMatch = salaryText.match(/([A-Z]{3})?\s*([\d,]+)/i);
      if (singleMatch) {
        job.salaryCurrency = (singleMatch[1] || '').toUpperCase();
        job.salaryMin = Number(singleMatch[2].replace(/,/g, ''));
      }
    }
  }

  result.push(job);
});