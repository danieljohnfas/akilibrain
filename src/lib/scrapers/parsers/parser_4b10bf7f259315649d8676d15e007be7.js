result = [];

$('.job-card, .job-listing, .job-item, article.job, .job').each((i, el) => {
  const $el = $(el);
  const title = $el.find('h2,a.job-title,.job-title,h3').first().text().trim();
  if (!title) return;

  const companyName = $el.find('.company-name,a.company,.company').first().text().trim();
  const description = $el.find('.description,.job-description').first().text().trim();
  const location = $el.find('.location,.job-location').first().text().trim();

  let jobType = '';
  const typeText = $el.find('.job-type,.type').text().toLowerCase();
  if (typeText.includes('full')) jobType = 'full_time';
  else if (typeText.includes('part')) jobType = 'part_time';
  else if (typeText.includes('contract')) jobType = 'contract';
  else if (typeText.includes('intern')) jobType = 'internship';
  else if (typeText.includes('remote')) jobType = 'remote';

  const sourceUrl = $el.find('a').attr('href') || $el.closest('a').attr('href') || '';
  const postedDateIsoString = $el.find('.posted-date,time').attr('datetime') || '';
  const deadlineIsoString = $el.find('.deadline,time').attr('datetime') || '';

  let salaryMin = null, salaryMax = null, salaryCurrency = '';
  const salaryText = $el.find('.salary').text();
  const salaryMatch = salaryText.match(/([A-Z]{3})\s*\$?([\d,]+)(?:\s*-\s*\$?([\d,]+))?/);
  if (salaryMatch) {
    salaryCurrency = salaryMatch[1];
    salaryMin = parseFloat(salaryMatch[2].replace(/,/g, ''));
    if (salaryMatch[3]) salaryMax = parseFloat(salaryMatch[3].replace(/,/g, ''));
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