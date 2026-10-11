result = [];
$('h3').each((i, el) => {
  const title = $(el).text().trim();
  if (title && /job|vacancy|position|career|opportunity/i.test(title)) {
    const jobEl = $(el).closest('.job, .position, .vacancy, [class*="job"], [class*="position"], [class*="vacancy"]');
    const jobObj = {
      title: title,
      companyName: $(el).parent().find('.company, .employer, .organization, [class*="company"], [class*="employer"], [class*="organization"]').text().trim() || '',
      description: jobEl.find('.description, .summary, .details, .content, [class*="description"], [class*="summary"], [class*="details"]').text().trim() || '',
      location: jobEl.find('.location, .place, [class*="location"], [class*="place"]').text().trim() || '',
      jobType: '',
      sourceUrl: $('link[rel="canonical"]').attr('href') || window.location.href,
      postedDateIsoString: '',
      deadlineIsoString: '',
      salaryMin: 0,
      salaryMax: 0,
      salaryCurrency: ''
    };

    const typeText = jobEl.text().toLowerCase();
    if (typeText.includes('full-time') || typeText.includes('full time')) jobObj.jobType = 'full_time';
    else if (typeText.includes('part-time') || typeText.includes('part time')) jobObj.jobType = 'part_time';
    else if (typeText.includes('contract')) jobObj.jobType = 'contract';
    else if (typeText.includes('internship')) jobObj.jobType = 'internship';
    else if (typeText.includes('remote')) jobObj.jobType = 'remote';

    const salaryText = jobEl.text().match(/\$?\d{1,3}(?:[,.]\d{3})*(?:\s*-\s*\$?\d{1,3}(?:[,.]\d{3})*)?/g);
    if (salaryText && salaryText.length > 0) {
      const nums = salaryText[0].replace(/[^\d.-]/g, '');
      const parts = nums.split('-');
      if (parts.length === 2) {
        jobObj.salaryMin = parseFloat(parts[0].replace(/,/g, '')) || 0;
        jobObj.salaryMax = parseFloat(parts[1].replace(/,/g, '')) || 0;
      } else {
        jobObj.salaryMin = parseFloat(parts[0].replace(/,/g, '')) || 0;
        jobObj.salaryMax = jobObj.salaryMin;
      }
      jobObj.salaryCurrency = 'USD';
    }

    result.push(jobObj);
  }
});