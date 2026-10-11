const jobSelectors = [
  '.job',
  '.job-listing',
  '.vacancy',
  '.career-item',
  '.listing-item',
  'article.job',
  'li.job',
  '.posting',
  '.position',
  '.career-listing'
];
let $jobs = $(jobSelectors.join(','));

if ($jobs.length) {
  $jobs.each((_, el) => {
    const jobEl = $(el);
    const title = jobEl.find('h1, h2, h3, .title, .job-title').first().text().trim() ||
                  jobEl.attr('data-title') || '';
    if (!title) return;

    const job = { title };

    const company = jobEl.find('.company, .company-name').first().text().trim();
    if (company) job.companyName = company;

    const desc = jobEl.find('.description, .job-description, p').text().trim();
    if (desc) job.description = desc;

    const location = jobEl.find('.location, .job-location').first().text().trim();
    if (location) job.location = location;

    const typeText = jobEl.find('.type, .job-type').first().text().toLowerCase().trim();
    if (typeText) {
      if (typeText.includes('full')) job.jobType = 'full_time';
      else if (typeText.includes('part')) job.jobType = 'part_time';
      else if (typeText.includes('contract')) job.jobType = 'contract';
      else if (typeText.includes('intern')) job.jobType = 'internship';
      else if (typeText.includes('remote')) job.jobType = 'remote';
    }

    const source = jobEl.find('a').filter((i, a) => {
      const href = $(a).attr('href') || '';
      return href && (href.includes('job') || href.includes('career'));
    }).first().attr('href');
    if (source) job.sourceUrl = source;

    const posted = jobEl.find('time[datetime], .posted-date').first().attr('datetime') ||
                   jobEl.find('.posted-date').first().text().trim();
    if (posted) job.postedDateIsoString = new Date(posted).toISOString();

    const deadline = jobEl.find('.deadline, .apply-by').first().attr('datetime') ||
                     jobEl.find('.deadline, .apply-by').first().text().trim();
    if (deadline) job.deadlineIsoString = new Date(deadline).toISOString();

    const salaryText = jobEl.find('.salary, .pay, .compensation').first().text();
    if (salaryText) {
      const salaryMatch = salaryText.replace(/,/g, '').match(/([A-Za-z]{3,})\s?(\d+(?:\.\d+)?)-?(\d+(?:\.\d+)?)/);
      if (salaryMatch) {
        job.salaryCurrency = salaryMatch[1];
        job.salaryMin = parseFloat(salaryMatch[2]);
        job.salaryMax = parseFloat(salaryMatch[3] || salaryMatch[2]);
      } else {
        const singleMatch = salaryText.replace(/,/g, '').match(/([A-Za-z]{3,})\s?(\d+(?:\.\d+)?)/);
        if (singleMatch) {
          job.salaryCurrency = singleMatch[1];
          job.salaryMin = job.salaryMax = parseFloat(singleMatch[2]);
        }
      }
    }

    result.push(job);
  });
}