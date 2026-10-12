const jobSelectors = [
  'article.job',
  '.job-card',
  '.job-listing',
  '.listing-item',
  '[itemtype="http://schema.org/JobPosting"]'
];

jobSelectors.forEach(selector => {
  $(selector).each(function () {
    const elem = $(this);
    const title = elem.find('h1, h2, h3, .title, .job-title').first().text().trim() || null;
    if (!title) return;

    const company = elem.find('.company, .company-name').first().text().trim() || null;
    const description = elem.find('.description, .job-description').first().text().trim() || null;
    const location = elem.find('.location, .job-location').first().text().trim() || null;

    const typeText = elem.find('.type, .job-type').first().text().trim().toLowerCase();
    let jobType = null;
    if (typeText.includes('full')) jobType = 'full_time';
    else if (typeText.includes('part')) jobType = 'part_time';
    else if (typeText.includes('contract')) jobType = 'contract';
    else if (typeText.includes('intern')) jobType = 'internship';
    else if (typeText.includes('remote')) jobType = 'remote';

    const sourceUrl = elem.find('a[href]').first().attr('href') || null;
    const posted = elem.find('time[datetime]').first().attr('datetime') || null;
    const deadline = elem.find('.deadline time[datetime]').first().attr('datetime') || null;

    const salaryText = elem.find('.salary').first().text();
    let salaryMin = null,
        salaryMax = null,
        salaryCurrency = null;
    if (salaryText) {
      const cleaned = salaryText.replace(/,/g, '').trim();
      const match = cleaned.match(/([A-Z]{3})?\s?(\d+(?:\.\d+)?)(?:\s?[-–]\s?(\d+(?:\.\d+)?))?/);
      if (match) {
        salaryCurrency = match[1] || null;
        salaryMin = Number(match[2]) || null;
        salaryMax = match[3] ? Number(match[3]) : salaryMin;
      }
    }

    result.push({
      title,
      companyName: company,
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
});