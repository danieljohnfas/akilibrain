const baseMeta = $('meta[name="app-base"]').attr('content') || '';
const containers = $('.job-item, .job-card, .listing-item, .vacancy, article.job, div[class*="job"], li[class*="job"]');
containers.each((_, el) => {
  const container = $(el);
  let title = '';
  let titleLink = '';
  const titleElem = container.find('h1, h2, h3, h4, a').filter((_, e) => /title|job|position/i.test($(e).text()));
  if (titleElem.length) {
    title = titleElem.first().text().trim();
    titleLink = titleElem.first().attr('href') || '';
  }
  if (!title) return;
  const companyName = container.find('[class*="company"], .employer, .brand').first().text().trim() || '';
  const description = container.find('[class*="desc"], .summary, p').first().text().trim() || '';
  const location = container.find('[class*="location"], .place').first().text().trim() || '';
  const typeText = container.find('[class*="type"], .employment-type').first().text().toLowerCase();
  let jobType = '';
  if (/full\s?time/.test(typeText)) jobType = 'full_time';
  else if (/part\s?time/.test(typeText)) jobType = 'part_time';
  else if (/contract/.test(typeText)) jobType = 'contract';
  else if (/intern/.test(typeText)) jobType = 'internship';
  else if (/remote/.test(typeText)) jobType = 'remote';
  const postedRaw = container.find('[class*="date"], .posted, time').first().attr('datetime') || container.find('[class*="date"], .posted, time').first().text();
  const postedDateIsoString = postedRaw ? new Date(postedRaw).toISOString() : '';
  const deadlineRaw = container.find('[class*="deadline"], .ends, .expire').first().attr('datetime') || container.find('[class*="deadline"], .ends, .expire').first().text();
  const deadlineIsoString = deadlineRaw ? new Date(deadlineRaw).toISOString() : '';
  const salaryText = container.find('[class*="salary"], .pay').first().text();
  let salaryMin = null, salaryMax = null, salaryCurrency = '';
  if (salaryText) {
    const currencyMatch = salaryText.match(/[\$€£¥]|[A-Z]{3}/);
    salaryCurrency = currencyMatch ? currencyMatch[0] : '';
    const numbers = salaryText.replace(/[^0-9\-]/g, '').split('-').map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    if (numbers.length === 1) {
      salaryMin = salaryMax = numbers[0];
    } else if (numbers.length >= 2) {
      salaryMin = numbers[0];
      salaryMax = numbers[1];
    }
  }
  const sourceUrl = titleLink ? (titleLink.startsWith('http') ? titleLink : `${baseMeta.replace(/\/+$/,'')}/${titleLink.replace(/^\/+/,'')}`) : '';
  result.push({
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
  });
});