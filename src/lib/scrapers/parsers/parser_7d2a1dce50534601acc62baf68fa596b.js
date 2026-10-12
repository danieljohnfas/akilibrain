const containers = $('.job-card, .job-item, .listing-item, .result-item, .position, .career-card');

containers.each(function () {
  const el = $(this);
  const title = el.find('.job-title, h2, h3, .title').first().text().trim();
  if (!title) return;

  const company = el.find('.company-name, .company, .employer').first().text().trim();
  const description = el.find('.job-description, .description').first().text().trim();
  const location = el.find('.job-location, .location').first().text().trim();

  const typeText = el.find('.job-type, .type').first().text().trim().toLowerCase();
  let jobType;
  if (typeText.includes('full')) jobType = 'full_time';
  else if (typeText.includes('part')) jobType = 'part_time';
  else if (typeText.includes('contract')) jobType = 'contract';
  else if (typeText.includes('intern')) jobType = 'internship';
  else if (typeText.includes('remote')) jobType = 'remote';

  const sourceUrl = el.find('a').first().attr('href') || '';
  const posted = el.find('time[datetime]').first().attr('datetime') || '';
  const deadline = el.find('.deadline time[datetime]').first().attr('datetime') || '';

  let salaryMin = null, salaryMax = null, salaryCurrency = null;
  const salaryText = el.find('.salary').first().text();
  if (salaryText) {
    const numbers = salaryText.replace(/[^0-9.,]/g, '').match(/([0-9.,]+)/g);
    if (numbers) {
      const parsed = numbers.map(s => parseFloat(s.replace(/,/g, '')));
      if (parsed.length === 1) {
        salaryMin = salaryMax = parsed[0];
      } else if (parsed.length >= 2) {
        salaryMin = parsed[0];
        salaryMax = parsed[1];
      }
    }
    const currencyMatch = salaryText.replace(/[0-9.,\s-]/g, '').trim();
    if (currencyMatch) salaryCurrency = currencyMatch;
  }

  const job = { title };
  if (company) job.companyName = company;
  if (description) job.description = description;
  if (location) job.location = location;
  if (jobType) job.jobType = jobType;
  if (sourceUrl) job.sourceUrl = sourceUrl;
  if (posted) job.postedDateIsoString = posted;
  if (deadline) job.deadlineIsoString = deadline;
  if (salaryMin !== null) job.salaryMin = salaryMin;
  if (salaryMax !== null) job.salaryMax = salaryMax;
  if (salaryCurrency) job.salaryCurrency = salaryCurrency;

  result.push(job);
});