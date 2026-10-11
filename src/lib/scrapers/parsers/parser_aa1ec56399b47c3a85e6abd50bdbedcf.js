const jobContainers = $('div.nonexistent12345');
jobContainers.each((_, el) => {
  const $el = $(el);
  const title = $el.find('h2.title, h3.title, a.job-title').first().text().trim();
  if (!title) return;
  const companyName = $el.find('.company, .employer').first().text().trim();
  const location = $el.find('.location, .job-location').first().text().trim();
  const description = $el.find('.description, .job-description').first().text().trim();
  const jobTypeText = $el.find('.job-type, .employment-type').first().text().trim().toLowerCase();
  let jobType = '';
  if (jobTypeText.includes('full')) jobType = 'full_time';
  else if (jobTypeText.includes('part')) jobType = 'part_time';
  else if (jobTypeText.includes('contract')) jobType = 'contract';
  else if (jobTypeText.includes('intern')) jobType = 'internship';
  else if (jobTypeText.includes('remote')) jobType = 'remote';
  const sourceUrl = $el.find('a').first().attr('href') || '';
  const postedDateText = $el.find('.date, .posted-date').first().text().trim();
  let postedDateIsoString = '';
  if (postedDateText) {
    const parsed = new Date(postedDateText);
    if (!isNaN(parsed.getTime())) postedDateIsoString = parsed.toISOString();
  }
  const deadlineText = $el.find('.deadline, .apply-by').first().text().trim();
  let deadlineIsoString = '';
  if (deadlineText) {
    const parsed = new Date(deadlineText);
    if (!isNaN(parsed.getTime())) deadlineIsoString = parsed.toISOString();
  }
  const salaryText = $el.find('.salary, .compensation').first().text().trim();
  let salaryMin = null, salaryMax = null, salaryCurrency = '';
  if (salaryText) {
    const match = salaryText.match(/([\d\s,]+)\s*[-–]\s*([\d\s,]+)\s*(\w+)/);
    if (match) {
      salaryMin = parseFloat(match[1].replace(/[\s,]/g, ''));
      salaryMax = parseFloat(match[2].replace(/[\s,]/g, ''));
      salaryCurrency = match[3];
    } else {
      const single = salaryText.match(/([\d\s,]+)\s*(\w+)/);
      if (single) {
        salaryMin = parseFloat(single[1].replace(/[\s,]/g, ''));
        salaryMax = salaryMin;
        salaryCurrency = single[2];
      }
    }
  }
  result.push({
    title,
    companyName: companyName || null,
    description: description || null,
    location: location || null,
    jobType: jobType || null,
    sourceUrl: sourceUrl || null,
    postedDateIsoString: postedDateIsoString || null,
    deadlineIsoString: deadlineIsoString || null,
    salaryMin: salaryMin !== null ? salaryMin : null,
    salaryMax: salaryMax !== null ? salaryMax : null,
    salaryCurrency: salaryCurrency || null
  });
});