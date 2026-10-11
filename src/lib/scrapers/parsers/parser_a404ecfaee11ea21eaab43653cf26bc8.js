let jobContainers = $('.job-listing, .job-item, .post, .entry');

jobContainers.each((i, el) => {
  let container = $(el);
  let title = container.find('h1, h2, h3').first().text().trim();
  if (!title) return;

  let textLower = container.text().toLowerCase();
  if (!/(apply|position|vacancy|salary|location)/.test(textLower)) return;

  let job = { title };

  let company = container.find('.company, .company-name').first().text().trim();
  if (company) job.companyName = company;

  let description = container.find('.description, .job-description, p').first().text().trim();
  if (description) job.description = description;

  let location = container.find('.location, .job-location').first().text().trim();
  if (location) job.location = location;

  let typeText = container.find('.job-type, .type').first().text().trim().toLowerCase();
  let typeMap = {
    'full time': 'full_time',
    'full-time': 'full_time',
    'part time': 'part_time',
    'part-time': 'part_time',
    'contract': 'contract',
    'internship': 'internship',
    'remote': 'remote'
  };
  if (typeMap[typeText]) job.jobType = typeMap[typeText];

  let source = container.find('a').filter((i, a) => $(a).text().toLowerCase().includes('apply')).attr('href');
  if (source) job.sourceUrl = source;

  let postedAttr = container.find('time[datetime]').attr('datetime');
  let postedText = postedAttr || container.find('.posted, .date-posted').first().text().trim();
  if (postedText) {
    let d = new Date(postedText);
    if (!isNaN(d)) job.postedDateIsoString = d.toISOString();
  }

  let deadlineText = container.find('.deadline, .apply-by').first().text().trim();
  if (deadlineText) {
    let d = new Date(deadlineText);
    if (!isNaN(d)) job.deadlineIsoString = d.toISOString();
  }

  let salaryText = container.find('.salary, .pay').first().text().trim();
  if (salaryText) {
    let match = salaryText.match(/([A-Z]{3})?\s*([\d.,]+)\s*(?:[-–to]{1,3})?\s*([\d.,]+)?/i);
    if (match) {
      if (match[1]) job.salaryCurrency = match[1];
      job.salaryMin = parseFloat(match[2].replace(/,/g, ''));
      if (match[3]) job.salaryMax = parseFloat(match[3].replace(/,/g, ''));
    }
  }

  result.push(job);
});