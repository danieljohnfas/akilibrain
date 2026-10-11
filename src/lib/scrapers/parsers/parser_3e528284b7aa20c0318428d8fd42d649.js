const possibleSelectors = [
  '[data-job]',
  '.job',
  '.job-item',
  '.job-listing',
  'article.job',
  'li.job',
  '.vacancy',
  '.position',
  '.listing .title',
  '.career-item'
];
let found = false;
for (let i = 0; i < possibleSelectors.length; i++) {
  const sel = possibleSelectors[i];
  const elems = $(sel);
  if (elems && elems.length) {
    elems.each(function () {
      const el = $(this);
      const title = el.find('h1, h2, h3, a, .title').first().text().trim();
      if (!title) return;
      const job = {
        title: title || null,
        companyName: el.find('.company, .company-name').first().text().trim() || null,
        description: el.find('.description, .desc, p').first().text().trim() || null,
        location: el.find('.location, .city, .place').first().text().trim() || null,
        jobType: null,
        sourceUrl: null,
        postedDateIsoString: null,
        deadlineIsoString: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null
      };
      const text = el.text().toLowerCase();
      if (/full\s*time/.test(text)) job.jobType = 'full_time';
      else if (/part\s*time/.test(text)) job.jobType = 'part_time';
      else if (/contract/.test(text)) job.jobType = 'contract';
      else if (/internship/.test(text)) job.jobType = 'internship';
      else if (/remote/.test(text)) job.jobType = 'remote';
      result.push(job);
    });
    found = true;
    break;
  }
}
if (!found) {
  // No recognizable job listings found; result remains empty.
}