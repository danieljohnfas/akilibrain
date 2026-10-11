const selectors = [
  '.job-item',
  '.job',
  '.vacancy',
  '.career-item',
  '.listing-item',
  '.job-listing',
  '.job-post',
  '[class*="job-"]',
  '[id*="job-"]'
];
let jobs = $(selectors.join(','));
if (jobs.length) {
  jobs.each((_, el) => {
    const container = $(el);
    const title = container.find('h1, h2, h3, .job-title, .title').first().text().trim();
    if (!title) return;
    const companyName = container.find('.company, .company-name, .employer').first().text().trim() || null;
    const description = container.find('.description, .job-description, .desc').first().text().trim() || null;
    const location = container.find('.location, .job-location, .city').first().text().trim() || null;
    const typeText = container.find('.type, .job-type, .employment-type').first().text().trim().toLowerCase() || null;
    let jobType = null;
    if (typeText) {
      if (typeText.includes('full')) jobType = 'full_time';
      else if (typeText.includes('part')) jobType = 'part_time';
      else if (typeText.includes('contract')) jobType = 'contract';
      else if (typeText.includes('intern')) jobType = 'internship';
      else if (typeText.includes('remote')) jobType = 'remote';
    }
    const sourceUrl = container.find('a').first().attr('href') ? new URL(container.find('a').first().attr('href'), 'https://example.com').href : null;
    const posted = container.find('time[datetime], .posted, .date-posted').first().attr('datetime') ||
                   container.find('.posted, .date-posted').first().text().trim();
    const postedDateIsoString = posted ? new Date(posted).toISOString() : null;
    const deadline = container.find('.deadline, .apply-by, time[datetime][class*="deadline"]').first().attr('datetime') ||
                     container.find('.deadline, .apply-by').first().text().trim();
    const deadlineIsoString = deadline ? new Date(deadline).toISOString() : null;
    const salaryText = container.find('.salary, .pay, .compensation').first().text().trim();
    let salaryMin = null, salaryMax = null, salaryCurrency = null;
    if (salaryText) {
      const match = salaryText.match(/([A-Z]{3})?\s*([\d,.]+)\s*(?:-|\sto\s)\s*([A-Z]{3})?\s*([\d,.]+)/i);
      if (match) {
        salaryCurrency = match[1] || match[3] || null;
        salaryMin = parseFloat(match[2].replace(/[,]/g, ''));
        salaryMax = parseFloat(match[4].replace(/[,]/g, ''));
      } else {
        const single = salaryText.match(/([A-Z]{3})?\s*([\d,.]+)/i);
        if (single) {
          salaryCurrency = single[1] || null;
          salaryMin = salaryMax = parseFloat(single[2].replace(/[,]/g, ''));
        }
      }
    }
    const job = {
      title,
      companyName,
      description,
      location,
      jobType,
      sourceUrl,
      postedDateIsoString,
      deadlineIsoString,
      salaryMin,
      salaryMax,
      salaryCurrency
    };
    result.push(job);
  });
}