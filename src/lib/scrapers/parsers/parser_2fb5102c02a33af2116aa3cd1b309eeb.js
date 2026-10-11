const jobs = [];
$('div.job, li.job, article.job, .job-listing, .position, .vacancy').each((i, el) => {
  const $el = $(el);
  const title = $el.find('h2, h3, .title, .job-title').first().text().trim();
  if (!title) return;
  const companyName = $el.find('.company, .company-name').first().text().trim() || null;
  const location = $el.find('.location, .job-location').first().text().trim() || null;
  const description = $el.find('.description, .job-description, .summary').first().text().trim() || null;
  let jobType = null;
  const typeText = $el.find('.job-type, .type, .employment-type').first().text().trim().toLowerCase();
  if (typeText) {
    if (/full[- ]time/.test(typeText)) jobType = 'full_time';
    else if (/part[- ]time/.test(typeType)) jobType = 'part_time';
    else if (/contract/.test(typeText)) jobType = 'contract';
    else if (/intern/.test(typeText)) jobType = 'internship';
    else if (/remote/.test(typeText)) jobType = 'remote';
  }
  const sourceUrl = $el.find('a').first().attr('href') || null;
  const postedDateText = $el.find('.date, .posted-date, time').first().attr('datetime') || $el.find('.date, .posted-date, time').first().text().trim();
  let postedDateIsoString = null;
  if (postedDateText) {
    const parsed = new Date(postedDateText);
    if (!isNaN(parsed.getTime())) postedDateIsoString = parsed.toISOString();
  }
  const deadlineText = $el.find('.deadline, .application-deadline').first().attr('datetime') || $el.find('.deadline, .application-deadline').first().text().trim();
  let deadlineIsoString = null;
  if (deadlineText) {
    const parsed = new Date(deadlineText);
    if (!isNaN(parsed.getTime())) deadlineIsoString = parsed.toISOString();
  }
  let salaryMin = null, salaryMax = null, salaryCurrency = null;
  const salaryText = $el.find('.salary, .wage, .compensation').first().text().trim();
  if (salaryText) {
    const match = salaryText.match(/([£$€]?)\s*([\d,]+(?:\.\d+)?)\s*(?:[-–to]\s*([£$€]?)\s*([\d,]+(?:\.\d+)?))?/i);
    if (match) {
      let cur = match[1] || match[3] || '';
      if (cur === '£') salaryCurrency = 'GBP';
      else if (cur === '$') salaryCurrency = 'USD';
      else if (cur === '€') salaryCurrency = 'EUR';
      let min = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(min)) salaryMin = min;
      if (match[4]) {
        let max = parseFloat(match[4].replace(/,/g, ''));
        if (!isNaN(max)) salaryMax = max;
      } else {
        salaryMax = salaryMin;
      }
    }
  }
  jobs.push({
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
result.push(...jobs);