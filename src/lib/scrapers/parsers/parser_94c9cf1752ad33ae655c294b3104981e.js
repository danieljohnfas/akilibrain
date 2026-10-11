const jobContainers = $('.job-card, .job-item, .listings .item, .job-list, .jobs .job, .card');
jobContainers.each((i, el) => {
  const container = $(el);
  const title = container.find('.job-title, h2, h3, .title').first().text().trim();
  if (!title) return;
  const job = { title };
  const company = container.find('.company-name, .company, .employer').first().text().trim();
  if (company) job.companyName = company;
  const desc = container.find('.job-description, .description, .desc').first().text().trim();
  if (desc) job.description = desc;
  const loc = container.find('.location, .job-location').first().text().trim();
  if (loc) job.location = loc;
  const typeText = container.find('.job-type, .type').first().text().trim().toLowerCase();
  if (typeText) {
    const map = { 'full time': 'full_time', 'full-time': 'full_time', 'part time': 'part_time', 'part-time': 'part_time', 'contract': 'contract', 'internship': 'internship', 'remote': 'remote' };
    job.jobType = map[typeText] || typeText.replace(/\s+/g, '_');
  }
  const link = container.find('a').first().attr('href');
  if (link) job.sourceUrl = link.startsWith('http') ? link : new URL(link, 'https://api.ekazi.co.tz').href;
  const postedRaw = container.find('.posted-date, .date').first().attr('datetime') || container.find('.posted-date, .date').first().text();
  if (postedRaw) {
    const iso = new Date(postedRaw).toISOString();
    if (!isNaN(Date.parse(iso))) job.postedDateIsoString = iso;
  }
  const deadlineRaw = container.find('.deadline, .apply-by').first().attr('datetime') || container.find('.deadline, .apply-by').first().text();
  if (deadlineRaw) {
    const iso = new Date(deadlineRaw).toISOString();
    if (!isNaN(Date.parse(iso))) job.deadlineIsoString = iso;
  }
  const salaryText = container.find('.salary, .pay').first().text();
  if (salaryText) {
    const match = salaryText.replace(/,/g, '').match(/([A-Z]{3})?\s*([\d]+)(?:\s*-\s*([A-Z]{3})?\s*([\d]+))?/i);
    if (match) {
      if (match[2]) job.salaryMin = Number(match[2]);
      if (match[4]) job.salaryMax = Number(match[4]);
      if (match[1]) job.salaryCurrency = match[1];
      else if (match[3]) job.salaryCurrency = match[3];
    }
  }
  result.push(job);
});