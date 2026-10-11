let jobContainers = $('.job, .job-listing, .posting, article.job, li.job-item');
jobContainers.each(function () {
  let elem = $(this);
  let title = elem.find('h1, h2, h3, .title, .job-title').first().text().trim() || null;
  if (!title) return;
  let companyName = elem.find('.company, .company-name').first().text().trim() || null;
  let description = elem.find('.description, .job-description, p').text().trim() || null;
  let location = elem.find('.location, .job-location').first().text().trim() || null;
  let jobTypeText = elem.find('.type, .job-type').first().text().trim().toLowerCase() || null;
  let jobType = null;
  if (jobTypeText) {
    if (/full\s*time/.test(jobTypeText)) jobType = 'full_time';
    else if (/part\s*time/.test(jobTypeText)) jobType = 'part_time';
    else if (/contract/.test(jobTypeText)) jobType = 'contract';
    else if (/internship|intern/.test(jobTypeText)) jobType = 'internship';
    else if (/remote/.test(jobTypeText)) jobType = 'remote';
  }
  let sourceUrl = elem.find('a').first().attr('href') || null;
  let postedDateIsoString = null;
  let deadlineIsoString = null;
  let salaryMin = null;
  let salaryMax = null;
  let salaryCurrency = null;
  let salaryText = elem.find('.salary, .pay, .compensation').first().text().trim();
  if (salaryText) {
    let currencyMatch = salaryText.match(/([A-Z]{3})/);
    if (currencyMatch) salaryCurrency = currencyMatch[1];
    let numbers = salaryText.match(/[\d,.]+/g);
    if (numbers && numbers.length) {
      let nums = numbers.map(n => parseFloat(n.replace(/,/g, '')));
      if (nums.length === 1) {
        salaryMin = salaryMax = nums[0];
      } else if (nums.length >= 2) {
        salaryMin = Math.min(...nums);
        salaryMax = Math.max(...nums);
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