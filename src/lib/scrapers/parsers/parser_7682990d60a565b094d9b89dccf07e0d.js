let jobContainers = $('.job, .job-listing, .posting, .vacancy, article.job, li.job-item');

jobContainers.each((i, el) => {
  let title = $(el).find('.title, h2, h3, a.job-title').first().text().trim();
  if (!title) return;
  let companyName = $(el).find('.company, .company-name').first().text().trim();
  let description = $(el).find('.description, .job-description').first().text().trim();
  let location = $(el).find('.location, .job-location').first().text().trim();
  let typeText = $(el).find('.type, .job-type').first().text().toLowerCase();
  let jobType;
  if (typeText.includes('full')) jobType = 'full_time';
  else if (typeText.includes('part')) jobType = 'part_time';
  else if (typeText.includes('contract')) jobType = 'contract';
  else if (typeText.includes('intern')) jobType = 'internship';
  else if (typeText.includes('remote')) jobType = 'remote';
  let sourceUrl = $(el).find('a').first().attr('href') || '';
  let posted = $(el).find('time[datetime]').first().attr('datetime') || '';
  let deadline = $(el).find('.deadline time[datetime]').first().attr('datetime') || '';
  let salaryText = $(el).find('.salary').first().text();
  let salaryMin, salaryMax, salaryCurrency;
  if (salaryText) {
    let match = salaryText.replace(/,/g, '').match(/([A-Z]{3})?\s*\$?(\d+)(?:\s*-\s*\$?(\d+))?/i);
    if (match) {
      salaryCurrency = match[1] || (salaryText.includes('$') ? 'USD' : '');
      salaryMin = parseFloat(match[2]) || undefined;
      salaryMax = match[3] ? parseFloat(match[3]) : undefined;
    }
  }
  result.push({
    title,
    companyName,
    description,
    location,
    jobType,
    sourceUrl,
    postedDateIsoString: posted,
    deadlineIsoString: deadline,
    salaryMin,
    salaryMax,
    salaryCurrency
  });
});