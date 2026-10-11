const containers = $('.job-listing, .job-card, .job, .listing, article.job, div.job');
if (containers.length) {
  containers.each((_, el) => {
    const $el = $(el);
    const title = $el.find('.job-title, h2, h3, h1').first().text().trim();
    if (!title) return;
    const companyName = $el.find('.company, .employer').first().text().trim() || '';
    const location = $el.find('.location').first().text().trim() || '';
    const description = $el.find('.description, .job-description, .details').first().text().trim() || '';
    const jobTypeText = $el.find('.job-type, .type, .employment-type').first().text().trim().toLowerCase() || '';
    let jobType = '';
    if (/full\s*time/.test(jobTypeText)) jobType = 'full_time';
    else if (/part\s*time/.test(jobTypeText)) jobType = 'part_time';
    else if (/contract/.test(jobTypeText)) jobType = 'contract';
    else if (/intern/.test(jobTypeText)) jobType = 'internship';
    else if (/remote/.test(jobTypeText)) jobType = 'remote';
    const sourceUrl = '';
    const postedDateRaw = $el.find('.date-posted, .posted-date').first().text().trim();
    const postedDateIsoString = postedDateRaw ? new Date(postedDateRaw).toISOString() : '';
    const deadlineRaw = $el.find('.deadline, .apply-by').first().text().trim();
    const deadlineIsoString = deadlineRaw ? new Date(deadlineRaw).toISOString() : '';
    const salaryText = $el.find('.salary, .compensation').first().text().trim();
    let salaryMin = null, salaryMax = null, salaryCurrency = '';
    if (salaryText) {
      const rangeMatch = salaryText.match(/([\d,.]+)\s*[-–]\s*([\d,.]+)\s*(\w+)/);
      if (rangeMatch) {
        salaryMin = parseFloat(rangeMatch[1].replace(/,/g, ''));
        salaryMax = parseFloat(rangeMatch[2].replace(/,/g, ''));
        salaryCurrency = rangeMatch[3];
      } else {
        const singleMatch = salaryText.match(/([\d,.]+)\s*(\w+)/);
        if (singleMatch) {
          const val = parseFloat(singleMatch[1].replace(/,/g, ''));
          salaryMin = val;
          salaryMax = val;
          salaryCurrency = singleMatch[2];
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
}