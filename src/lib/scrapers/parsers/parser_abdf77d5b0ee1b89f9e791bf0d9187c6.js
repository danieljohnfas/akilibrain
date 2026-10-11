const selectors = [
  '.job',
  '.job-listing',
  '.vacancy',
  '.position',
  '.career-item',
  'article.job',
  'li.job',
  '.listing-item',
  '.posting',
  '.career-opportunity'
].join(',');

const jobElems = $(selectors);

jobElems.each((_, elem) => {
  const $elem = $(elem);

  // Try to find a clear title
  const title = $elem.find('h1, h2, h3, .title, .job-title, .listing-title')
    .first()
    .text()
    .trim();

  if (!title) return; // not a real job entry

  const job = { title };

  const company = $elem.find('.company, .company-name, .employer')
    .first()
    .text()
    .trim();
  if (company) job.companyName = company;

  const description = $elem.find('.description, .job-description, .summary, p')
    .first()
    .text()
    .trim();
  if (description) job.description = description;

  const location = $elem.find('.location, .job-location')
    .first()
    .text()
    .trim();
  if (location) job.location = location;

  const typeText = $elem.find('.job-type, .type')
    .first()
    .text()
    .trim()
    .toLowerCase();
  if (typeText) {
    if (typeText.includes('full')) job.jobType = 'full_time';
    else if (typeText.includes('part')) job.jobType = 'part_time';
    else if (typeText.includes('contract')) job.jobType = 'contract';
    else if (typeText.includes('intern')) job.jobType = 'internship';
    else if (typeText.includes('remote')) job.jobType = 'remote';
  }

  const source = $elem.find('a')
    .first()
    .attr('href');
  if (source) job.sourceUrl = source;

  const posted = $elem.find('time[datetime], .posted')
    .first()
    .attr('datetime') || $elem.find('.posted').first().text().trim();
  if (posted) {
    const iso = new Date(posted).toISOString();
    if (!isNaN(Date.parse(iso))) job.postedDateIsoString = iso;
  }

  const deadline = $elem.find('.deadline, time[datetime][class*="deadline"]')
    .first()
    .attr('datetime') || $elem.find('.deadline').first().text().trim();
  if (deadline) {
    const iso = new Date(deadline).toISOString();
    if (!isNaN(Date.parse(iso))) job.deadlineIsoString = iso;
  }

  const salaryText = $elem.find('.salary, .pay')
    .first()
    .text()
    .trim()
    .toLowerCase();
  if (salaryText) {
    const match = salaryText.match(/([£$€])?\s*([\d,]+)(?:\s*-\s*([£$€])?\s*([\d,]+))?/);
    if (match) {
      const currency = match[1] || match[3] || '';
      const min = parseInt(match[2].replace(/,/g, ''), 10);
      const max = match[4] ? parseInt(match[4].replace(/,/g, ''), 10) : undefined;
      if (!isNaN(min)) job.salaryMin = min;
      if (max !== undefined && !isNaN(max)) job.salaryMax = max;
      if (currency) job.salaryCurrency = currency;
    }
  }

  result.push(job);
});