const jobCards = $('.job-card');

jobCards.each((_, el) => {
  const card = $(el);

  const title = card.find('h1, h2, h3, h4, h5, .title, .job-title, .card-title').first().text().trim();
  if (!title) return;

  const companyName = card.find('.company, .company-name, .card-company').first().text().trim() || null;

  const description = card.find('.description, .job-description, p').first().text().trim() || null;

  const location = card.find('.location, .job-location, .badge.location').first().text().trim() || null;

  let jobType = null;
  const typeText = card.find('.badge, .job-type').first().text().trim().toLowerCase();
  if (typeText.includes('full')) jobType = 'full_time';
  else if (typeText.includes('part')) jobType = 'part_time';
  else if (typeText.includes('contract')) jobType = 'contract';
  else if (typeText.includes('intern')) jobType = 'internship';
  else if (typeText.includes('remote')) jobType = 'remote';

  const sourceUrl = card.find('a.apply-button, a[href*="apply"], a[href]').first().attr('href') || null;

  const postedText = card.find('.posted, .posted-date, .date').first().text();
  let postedDateIsoString = null;
  if (postedText) {
    const m = postedText.match(/(\d{4}-\d{2}-\d{2})/);
    if (m) postedDateIsoString = new Date(m[1]).toISOString();
  }

  const deadlineText = card.find('.deadline, .apply-deadline').first().text();
  let deadlineIsoString = null;
  if (deadlineText) {
    const m = deadlineText.match(/(\d{4}-\d{2}-\d{2})/);
    if (m) deadlineIsoString = new Date(m[1]).toISOString();
  }

  let salaryMin = null, salaryMax = null, salaryCurrency = null;
  const salaryText = card.find('.salary, .pay, .compensation').first().text();
  if (salaryText) {
    const clean = salaryText.replace(/,/g, '');
    const rangeMatch = clean.match(/([A-Za-z$£€¥]+)?\s?(\d+(?:\.\d+)?)(?:\s?[-–]\s?([A-Za-z$£€¥]*\s?\d+(?:\.\d+)?))?/);
    if (rangeMatch) {
      salaryCurrency = rangeMatch[1] ? rangeMatch[1].trim() : null;
      salaryMin = parseFloat(rangeMatch[2]);
      if (rangeMatch[3]) {
        const maxPart = rangeMatch[3].trim();
        const maxMatch = maxPart.match(/([A-Za-z$£€¥]+)?\s?(\d+(?:\.\d+)?)/);
        if (maxMatch) {
          if (!salaryCurrency) salaryCurrency = maxMatch[1] ? maxMatch[1].trim() : null;
          salaryMax = parseFloat(maxMatch[2]);
        }
      }
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