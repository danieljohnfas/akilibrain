const jobKeywords = ['engineer','developer','manager','designer','analyst','assistant','consultant','specialist','coordinator','intern','technician','sales','marketing','product','lead','director'];
const containers = $('.job, .job-listing, .posting, [class*="job"], article, li');
containers.each((_, el) => {
  const $el = $(el);
  const title = $el.find('h1, h2, h3, .title, .job-title, a').first().text().trim();
  if (!title) return;
  const lowerTitle = title.toLowerCase();
  if (!jobKeywords.some(k => lowerTitle.includes(k))) return;
  const job = { title };
  const company = $el.find('.company, .company-name, .employer').first().text().trim();
  if (company) job.companyName = company;
  const description = $el.find('.description, .job-description, p').first().text().trim();
  if (description) job.description = description;
  const location = $el.find('.location, .job-location').first().text().trim();
  if (location) job.location = location;
  const typeMap = { full: 'full_time', part: 'part_time', contract: 'contract', internship: 'internship', intern: 'internship', remote: 'remote' };
  const typeText = $el.find('.type, .job-type').first().text().toLowerCase();
  for (const key in typeMap) {
    if (typeText.includes(key)) {
      job.jobType = typeMap[key];
      break;
    }
  }
  const link = $el.find('a[href]').first().attr('href');
  if (link) {
    try {
      job.sourceUrl = new URL(link, 'https://example.com').href;
    } catch (e) {}
  }
  const postedAttr = $el.find('time[datetime]').first().attr('datetime');
  const postedText = postedAttr || $el.find('.posted-date').first().text().trim();
  if (postedText) {
    const d = new Date(postedText);
    if (!isNaN(d)) job.postedDateIsoString = d.toISOString();
  }
  const deadlineAttr = $el.find('time[datetime]').first().attr('datetime');
  const deadlineText = deadlineAttr || $el.find('.deadline, .apply-by').first().text().trim();
  if (deadlineText) {
    const d = new Date(deadlineText);
    if (!isNaN(d)) job.deadlineIsoString = d.toISOString();
  }
  const salaryText = $el.find('.salary, .compensation').first().text();
  if (salaryText) {
    const rangeMatch = salaryText.replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      job.salaryMin = parseFloat(rangeMatch[1]);
      job.salaryMax = parseFloat(rangeMatch[2]);
    } else {
      const singleMatch = salaryText.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
      if (singleMatch) {
        job.salaryMin = parseFloat(singleMatch[1]);
        job.salaryMax = job.salaryMin;
      }
    }
    const curMatch = salaryText.match(/([A-Z]{3})/);
    if (curMatch) job.salaryCurrency = curMatch[1];
  }
  result.push(job);
});