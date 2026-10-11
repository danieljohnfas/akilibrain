const selectors = [
  '.job',
  '.job-item',
  '.career-item',
  '[data-job]',
  'article.job',
  'li.job',
  '.listing',
  '.vacancy',
  '.position'
];
const seen = new Set();
selectors.forEach(sel => {
  $(sel).each((_, el) => {
    const container = $(el);
    const title = container.find('h1, h2, h3, .title, .job-title, a').first().text().trim();
    if (!title) return;
    const company = container.find('.company, .company-name, .employer').first().text().trim();
    const description = container.find('.description, .job-description, p').text().trim();
    const location = container.find('.location, .job-location').first().text().trim();
    const typeText = container.find('.type, .job-type').first().text().trim().toLowerCase();
    let jobType;
    if (typeText.includes('full')) jobType = 'full_time';
    else if (typeText.includes('part')) jobType = 'part_time';
    else if (typeText.includes('contract')) jobType = 'contract';
    else if (typeText.includes('intern')) jobType = 'internship';
    else if (typeText.includes('remote')) jobType = 'remote';
    const sourceUrl = container.find('a[href]').first().attr('href') || '';
    const posted = container.find('time[datetime]').first().attr('datetime') || '';
    const deadline = container.find('.deadline time[datetime]').first().attr('datetime') || '';
    let salaryMin = null;
    let salaryMax = null;
    let salaryCurrency = '';
    const salaryText = container.find('.salary').first().text();
    const salaryMatch = salaryText.replace(/,/g, '').match(/([A-Z]{3})?\s?(\d+(?:\.\d+)?)(?:\s?-\s?([A-Z]{3})?\s?(\d+(?:\.\d+)?))?/);
    if (salaryMatch) {
      salaryCurrency = salaryMatch[1] || salaryMatch[3] || '';
      salaryMin = Number(salaryMatch[2]) || null;
      salaryMax = salaryMatch[4] ? Number(salaryMatch[4]) : null;
    }
    const key = title + '|' + company;
    if (seen.has(key)) return;
    seen.add(key);
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