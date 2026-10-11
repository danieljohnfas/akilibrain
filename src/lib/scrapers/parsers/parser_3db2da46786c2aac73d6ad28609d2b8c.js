const jobContainers = $('article.job, .job-item, .vacancy, .posting, .job-listing, li[data-job-id], div[data-job-id], .career-item');

jobContainers.each((i, elem) => {
  const container = $(elem);
  const titleEl = container.find('h1, h2, h3, a.title, a.job-title, .title').first();
  const title = titleEl.text().trim();
  if (!title) return;
  const job = { title };
  const company = container.find('.company, .company-name').first().text().trim();
  if (company) job.companyName = company;
  const desc = container.find('.description, .job-description, p').first().text().trim();
  if (desc) job.description = desc;
  const loc = container.find('.location, .job-location').first().text().trim();
  if (loc) job.location = loc;
  const typeText = container.find('.type, .job-type').first().text().trim().toLowerCase();
  if (typeText) {
    if (typeText.includes('full')) job.jobType = 'full_time';
    else if (typeText.includes('part')) job.jobType = 'part_time';
    else if (typeText.includes('contract')) job.jobType = 'contract';
    else if (typeText.includes('intern')) job.jobType = 'internship';
    else if (typeText.includes('remote')) job.jobType = 'remote';
  }
  const link = titleEl.attr('href') || container.find('a').first().attr('href');
  if (link) job.sourceUrl = link;
  const posted = container.attr('data-posted') || container.find('[data-posted]').attr('data-posted');
  if (posted) {
    const d = new Date(posted);
    if (!isNaN(d)) job.postedDateIsoString = d.toISOString();
  }
  const deadline = container.attr('data-deadline') || container.find('[data-deadline]').attr('data-deadline');
  if (deadline) {
    const d = new Date(deadline);
    if (!isNaN(d)) job.deadlineIsoString = d.toISOString();
  }
  const salaryText = container.find('.salary, .pay').first().text();
  if (salaryText) {
    const cleaned = salaryText.replace(/[\\s,]/g, '');
    const match = cleaned.match(/([A-Z]{3})?\\$?(\\d+(?:\\.\\d+)?)/);
    if (match) {
      const amount = parseFloat(match[2]);
      if (!isNaN(amount)) {
        job.salaryMin = amount;
        job.salaryMax = amount;
        if (match[1]) job.salaryCurrency = match[1];
      }
    }
  }
  result.push(job);
});