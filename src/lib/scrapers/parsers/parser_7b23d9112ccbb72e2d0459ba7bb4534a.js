const jobContainers = $('.job-card, .jobItem, .job-listing, .job, .searchResultItem, .listing-item');
if (jobContainers.length) {
  jobContainers.each((_, elem) => {
    const $elem = $(elem);
    const title = $elem.find('h1, h2, h3, .job-title, .title, a[data-testid="jobTitle"]').first().text().trim();
    if (!title) return;
    const companyName = $elem.find('.company-name, .company, .employer, .brand').first().text().trim() || null;
    const description = $elem.find('.job-description, .description, .summary, p').first().text().trim() || null;
    const location = $elem.find('.location, .job-location, .city, .place').first().text().trim() || null;
    const typeText = $elem.find('.job-type, .type, .contract-type').first().text().toLowerCase();
    let jobType = null;
    if (/full\s?time/.test(typeText)) jobType = 'full_time';
    else if (/part\s?time/.test(typeText)) jobType = 'part_time';
    else if (/contract/.test(typeText)) jobType = 'contract';
    else if (/internship|intern/.test(typeText)) jobType = 'internship';
    else if (/remote/.test(typeText)) jobType = 'remote';
    const sourceLink = $elem.find('a[href]').first();
    const sourceUrl = sourceLink.length ? sourceLink.attr('href') : null;
    const postedElem = $elem.find('.posted-date, time[datetime]').first();
    const postedDateIsoString = postedElem.attr('datetime') || (postedElem.text() ? new Date(postedElem.text()).toISOString() : null);
    const deadlineElem = $elem.find('.deadline, .apply-deadline').first();
    const deadlineIsoString = deadlineElem.attr('datetime') || (deadlineElem.text() ? new Date(deadlineElem.text()).toISOString() : null);
    const salaryText = $elem.find('.salary, .compensation').first().text();
    let salaryMin = null, salaryMax = null, salaryCurrency = null;
    if (salaryText) {
      const curMatch = salaryText.match(/[$€£¥]/);
      salaryCurrency = curMatch ? curMatch[0] : null;
      const nums = salaryText.replace(/[^0-9.-]+/g, ' ').trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
      if (nums.length === 1) {
        salaryMin = salaryMax = nums[0];
      } else if (nums.length >= 2) {
        salaryMin = nums[0];
        salaryMax = nums[1];
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