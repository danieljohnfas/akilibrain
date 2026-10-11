const jobSelectors = ['.job', '.job-listing', '.vacancy', '.position', '[data-job]'];
let found = false;
for (const sel of jobSelectors) {
  const elems = $(sel);
  if (elems.length) {
    found = true;
    elems.each((_, el) => {
      const $e = $(el);
      const title = $e.find('.job-title, h2, h3, .title').first().text().trim() || null;
      const companyName = $e.find('.company, .employer, .company-name').first().text().trim() || null;
      const location = $e.find('.location, .job-location').first().text().trim() || null;
      const description = $e.find('.description, .summary, .job-description').first().text().trim() || null;
      let jobType = null;
      const typeText = $e.text().toLowerCase();
      if (/full[-_]?time/.test(typeText)) jobType = 'full_time';
      else if (/part[-_]?time/.test(typeText)) jobType = 'part_time';
      else if (/contract/.test(typeText)) jobType = 'contract';
      else if (/intern/.test(typeText)) jobType = 'internship';
      else if (/remote/.test(typeText)) jobType = 'remote';
      const link = $e.find('a').first().attr('href');
      const sourceUrl = link || null;
      const dateText = $e.find('.date, .posted, time').first().attr('datetime') || $e.find('.date, .posted, time').first().text().trim();
      let postedDateIsoString = null;
      if (dateText && !isNaN(Date.parse(dateText))) {
        postedDateIsoString = new Date(dateText).toISOString();
      }
      const deadlineText = $e.find('.deadline, .expires').first().attr('datetime') || $e.find('.deadline, .expires').first().text().trim();
      let deadlineIsoString = null;
      if (deadlineText && !isNaN(Date.parse(deadlineText))) {
        deadlineIsoString = new Date(deadlineText).toISOString();
      }
      const salaryText = $e.find('.salary, .compensation').first().text().trim();
      let salaryMin = null, salaryMax = null, salaryCurrency = null;
      if (salaryText) {
        const rangeMatch = salaryText.match(/([\d\s,]+)\s*[-–]\s*([\d\s,]+)\s*(\w+)/);
        if (rangeMatch) {
          salaryMin = parseFloat(rangeMatch[1].replace(/[\s,]/g, ''));
          salaryMax = parseFloat(rangeMatch[2].replace(/[\s,]/g, ''));
          salaryCurrency = rangeMatch[3];
        } else {
          const singleMatch = salaryText.match(/([\d\s,]+)\s*(\w+)/);
          if (singleMatch) {
            salaryMin = parseFloat(singleMatch[1].replace(/[\s,]/g, ''));
            salaryMax = salaryMin;
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
    break;
  }
}