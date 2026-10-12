const containers = $('.job-listing, .job-item, .job-card, .posting, article[itemtype="https://schema.org/JobPosting"], .result-item');
containers.each(function () {
  const el = $(this);
  const title = el.find('[itemprop="title"], .job-title, h1, h2, h3').first().text().trim();
  if (!title) return;
  const companyName = el.find('[itemprop="hiringOrganization"], .company-name, .company').first().text().trim();
  const description = el.find('[itemprop="description"], .job-description, .description').first().text().trim();
  const location = el.find('[itemprop="jobLocation"], .location').first().text().trim();
  const typeText = el.find('[itemprop="employmentType"], .employment-type, .job-type').first().text().toLowerCase();
  let jobType;
  if (typeText.includes('full')) jobType = 'full_time';
  else if (typeText.includes('part')) jobType = 'part_time';
  else if (typeText.includes('contract')) jobType = 'contract';
  else if (typeText.includes('intern')) jobType = 'internship';
  else if (typeText.includes('remote')) jobType = 'remote';
  const sourceUrl = el.find('a[href]').first().attr('href') || '';
  const posted = el.find('[itemprop="datePosted"], .date-posted, .posted-date').first().attr('datetime') || el.find('[itemprop="datePosted"], .date-posted, .posted-date').first().text().trim();
  const deadline = el.find('[itemprop="validThrough"], .deadline, .expire-date').first().attr('datetime') || el.find('[itemprop="validThrough"], .deadline, .expire-date').first().text().trim();
  const salaryText = el.find('[itemprop="baseSalary"], .salary').first().text().trim();
  let salaryMin, salaryMax, salaryCurrency;
  if (salaryText) {
    const match = salaryText.match(/([A-Z]{3})?\s*([0-9.,]+)\s*-?\s*([0-9.,]+)?/);
    if (match) {
      salaryCurrency = match[1] || '';
      salaryMin = parseFloat(match[2].replace(/[,]/g, ''));
      salaryMax = match[3] ? parseFloat(match[3].replace(/[,]/g, '')) : salaryMin;
    }
  }
  result.push({
    title,
    companyName,
    description,
    location,
    jobType,
    sourceUrl,
    postedDateIsoString: posted || '',
    deadlineIsoString: deadline || '',
    salaryMin: salaryMin !== undefined ? salaryMin : null,
    salaryMax: salaryMax !== undefined ? salaryMax : null,
    salaryCurrency: salaryCurrency || ''
  });
});