const jobSelectors = [
  '.job',
  '.job-item',
  '.job-listing',
  '.vacancy',
  '.career-item',
  '[itemtype="http://schema.org/JobPosting"]'
];
const $jobs = $(jobSelectors.join(','));

$jobs.each(function () {
  const $el = $(this);
  const title = $el.find('h1, h2, h3, .title, .job-title').first().text().trim();
  if (!title) return;

  const job = { title };

  const company = $el.find('.company, .company-name').first().text().trim();
  if (company) job.companyName = company;

  const description = $el.find('.description, .job-description, p').first().text().trim();
  if (description) job.description = description;

  const location = $el.find('.location, .job-location').first().text().trim();
  if (location) job.location = location;

  const typeText = $el.find('.type, .job-type').first().text().toLowerCase();
  if (typeText) {
    if (/full\s?time/.test(typeText)) job.jobType = 'full_time';
    else if (/part\s?time/.test(typeText)) job.jobType = 'part_time';
    else if (/contract/.test(typeText)) job.jobType = 'contract';
    else if (/internship/.test(typeText)) job.jobType = 'internship';
    else if (/remote/.test(typeText)) job.jobType = 'remote';
  }

  const sourceUrl = $el
    .find('a[href]')
    .filter(function () {
      const txt = $(this).text().toLowerCase();
      return txt.includes('apply') || txt.includes('details') || txt.includes('job');
    })
    .first()
    .attr('href');
  if (sourceUrl) job.sourceUrl = sourceUrl;

  const posted = $el.find('time[datetime]').first().attr('datetime');
  if (posted) job.postedDateIsoString = posted;

  const deadline = $el.find('.deadline time[datetime]').first().attr('datetime');
  if (deadline) job.deadlineIsoString = deadline;

  const salaryText = $el.find('.salary').first().text();
  if (salaryText) {
    const match = salaryText.match(/([A-Z]{3})\s?([\d,]+)(?:\s?-\s?([A-Z]{3})?\s?([\d,]+))?/);
    if (match) {
      job.salaryCurrency = match[1];
      job.salaryMin = parseInt(match[2].replace(/,/g, ''), 10);
      if (match[4]) {
        job.salaryMax = parseInt(match[4].replace(/,/g, ''), 10);
      } else if (match[3]) {
        job.salaryMax = parseInt(match[3].replace(/,/g, ''), 10);
      }
    }
  }

  result.push(job);
});