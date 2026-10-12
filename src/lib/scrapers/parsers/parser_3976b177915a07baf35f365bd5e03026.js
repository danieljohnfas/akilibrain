const jobSelectors = [
  '.vacancy-item',
  '.job-item',
  '.job-listing',
  '.career-item',
  'article.job',
  'li.job'
];

jobSelectors.forEach(selector => {
  $(selector).each(function () {
    const el = $(this);
    const title = el.find('h1, h2, h3, .job-title').first().text().trim();
    if (!title) return;

    const job = { title };

    const company = el.find('.company-name, .employer').first().text().trim();
    if (company) job.companyName = company;

    const description = el.find('.description, .job-desc').first().text().trim();
    if (description) job.description = description;

    const location = el.find('.location').first().text().trim();
    if (location) job.location = location;

    const typeText = el.find('.job-type').first().text().trim().toLowerCase();
    const typeMap = {
      'full time': 'full_time',
      'full-time': 'full_time',
      'part time': 'part_time',
      'part-time': 'part_time',
      contract: 'contract',
      internship: 'internship',
      remote: 'remote'
    };
    if (typeMap[typeText]) job.jobType = typeMap[typeText];

    const source = el.find('a.apply-link').attr('href');
    if (source) job.sourceUrl = source;

    const postedRaw = el.find('time.posted').attr('datetime') || el.find('.posted-date').text().trim();
    if (postedRaw) {
      const d = new Date(postedRaw);
      if (!isNaN(d)) job.postedDateIsoString = d.toISOString();
    }

    const deadlineRaw = el.find('time.deadline').attr('datetime') || el.find('.deadline-date').text().trim();
    if (deadlineRaw) {
      const d2 = new Date(deadlineRaw);
      if (!isNaN(d2)) job.deadlineIsoString = d2.toISOString();
    }

    const salaryText = el.find('.salary').first().text().trim();
    if (salaryText) {
      let m = salaryText.match(/([A-Za-z]{3,})\s*([\d,]+)\s*-\s*([\d,]+)/);
      if (m) {
        job.salaryCurrency = m[1];
        job.salaryMin = Number(m[2].replace(/,/g, ''));
        job.salaryMax = Number(m[3].replace(/,/g, ''));
      } else {
        m = salaryText.match(/([\d,]+)\s*-\s*([\d,]+)\s*([A-Za-z]{3,})/);
        if (m) {
          job.salaryMin = Number(m[1].replace(/,/g, ''));
          job.salaryMax = Number(m[2].replace(/,/g, ''));
          job.salaryCurrency = m[3];
        }
      }
    }

    result.push(job);
  });
});