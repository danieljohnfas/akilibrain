const jobSelectors = [
  '.job-item',
  '.job-listing',
  '.vacancy',
  '.job-card',
  '.listing-item',
  '.career-item',
  '.position',
  '.post',
  'article.job',
  'li.job'
];
const containers = $(jobSelectors.join(','));
containers.each(function () {
  const el = $(this);
  const title = el.find('h1, h2, h3, .title, .job-title, a').first().text().trim();
  if (!title) return;
  const companyName = el.find('.company, .company-name, .employer').first().text().trim() || null;
  const description = el.find('.description, .job-description, .desc, p').first().text().trim() || null;
  const location = el.find('.location, .job-location, .place').first().text().trim() || null;
  const typeText = el.find('.type, .job-type, .employment-type').first().text().trim().toLowerCase();
  let jobType = null;
  if (/full\s*time/.test(typeText)) jobType = 'full_time';
  else if (/part\s*time/.test(typeText)) jobType = 'part_time';
  else if (/contract/.test(typeText)) jobType = 'contract';
  else if (/internship/.test(typeText)) jobType = 'internship';
  else if (/remote/.test(typeText)) jobType = 'remote';
  const sourceUrl = el.find('a').first().attr('href') ? new URL(el.find('a').first().attr('href'), (typeof window !== 'undefined' && window.location) ? window.location.href : '').href : null;
  const postedRaw = el.find('.posted, .date-posted, time').first().attr('datetime') || el.find('.posted, .date-posted, time').first().text().trim();
  const postedDateIsoString = postedRaw ? new Date(postedRaw).toISOString() : null;
  const deadlineRaw = el.find('.deadline, .date-deadline, .apply-by').first().attr('datetime') || el.find('.deadline, .date-deadline, .apply-by').first().text().trim();
  const deadlineIsoString = deadlineRaw ? new Date(deadlineRaw).toISOString() : null;
  const salaryText = el.find('.salary, .pay, .compensation').first().text().trim();
  let salaryMin = null, salaryMax = null, salaryCurrency = null;
  if (salaryText) {
    const currencyMatch = salaryText.match(/[\$€£¥]/);
    if (currencyMatch) salaryCurrency = currencyMatch[0];
    const numbers = salaryText.replace(/[^\d\.\-]/g, ' ').trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
    if (numbers.length === 1) {
      salaryMin = salaryMax = numbers[0];
    } else if (numbers.length >= 2) {
      salaryMin = Math.min(...numbers);
      salaryMax = Math.max(...numbers);
    }
  }
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