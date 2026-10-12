const containers = $('.job-card, .job-item, .job-listing, .listing-item, article.job, .job-detail');

containers.each((_, el) => {
  const elem = $(el);

  const title = elem.find('h1, h2, .job-title, .title').first().text().trim();
  if (!title) return;

  const companyName = elem.find('.company-name, .company, .employer').first().text().trim() || null;
  const description = elem.find('.job-description, .description, .details').first().text().trim() || null;
  const location = elem.find('.location, .job-location').first().text().trim() || null;
  const typeText = elem.find('.job-type, .type, .employment-type').first().text().trim().toLowerCase();

  let jobType = null;
  if (typeText.includes('full')) jobType = 'full_time';
  else if (typeText.includes('part')) jobType = 'part_time';
  else if (typeText.includes('contract')) jobType = 'contract';
  else if (typeText.includes('intern')) jobType = 'internship';
  else if (typeText.includes('remote')) jobType = 'remote';

  const sourceUrl = elem.find('a.apply-link, a.apply, a[href*="apply"]').attr('href') || null;

  const postedDate = elem.find('time.posted, .posted-date').attr('datetime') ||
                     elem.find('.posted-date').text().trim();
  const deadlineDate = elem.find('time.deadline, .deadline-date').attr('datetime') ||
                       elem.find('.deadline-date').text().trim();

  const salaryText = elem.find('.salary, .compensation').first().text().trim();
  let salaryMin = null, salaryMax = null, salaryCurrency = null;
  if (salaryText) {
    const match = salaryText.match(/([A-Z]{3})?\s*([\d,]+)(?:\s*-\s*([A-Z]{3})?\s*([\d,]+))?/);
    if (match) {
      salaryCurrency = match[1] || match[3] || null;
      salaryMin = Number(match[2].replace(/,/g, '')) || null;
      if (match[4]) salaryMax = Number(match[4].replace(/,/g, '')) || null;
    }
  }

  result.push({
    title,
    companyName,
    description,
    location,
    jobType,
    sourceUrl,
    postedDateIsoString: postedDate || null,
    deadlineIsoString: deadlineDate || null,
    salaryMin,
    salaryMax,
    salaryCurrency
  });
});