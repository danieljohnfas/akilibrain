const jobSelectors = [
  '.job',
  '.job-listing',
  '.vacancy',
  '.posting',
  '.career-item',
  'article[data-job]',
  'li[data-job]',
  '.search-result-item',
  '.position',
  '.opening',
  '.listing-item'
];
const $jobs = $(jobSelectors.join(','));

if ($jobs.length) {
  $jobs.each((_, el) => {
    const $el = $(el);
    const title =
      $el.find('h1, h2, h3, .title, .job-title, a').first().text().trim() ||
      null;
    if (!title) return;

    const sourceUrl =
      $el.find('a[href]').first().attr('href') ?
        new URL($el.find('a[href]').first().attr('href'), (typeof window !== 'undefined' && window.location?.href) || '').href :
        null;

    const companyName =
      $el.find('.company, .company-name, .employer, .org').first().text().trim() ||
      null;

    const description =
      $el.find('.description, .job-description, .desc, p').first().text().trim() ||
      null;

    const locationText =
      $el.find('.location, .job-location, .city, .place').first().text().trim() ||
      null;
    const location = locationText || null;

    const typeText =
      $el.find('.type, .job-type, .employment-type').first().text().trim().toLowerCase() ||
      '';
    let jobType = null;
    if (/full\s?time/.test(typeText)) jobType = 'full_time';
    else if (/part\s?time/.test(typeText)) jobType = 'part_time';
    else if (/contract/.test(typeText)) jobType = 'contract';
    else if (/internship/.test(typeText)) jobType = 'internship';
    else if (/remote/.test(typeText)) jobType = 'remote';

    const postedText =
      $el.find('.posted, .date-posted, time').first().attr('datetime') ||
      $el.find('.posted, .date-posted, time').first().text().trim();
    const postedDateIsoString = postedText
      ? new Date(postedText).toISOString()
      : null;

    const deadlineText =
      $el.find('.deadline, .apply-by, .closing-date').first().text().trim();
    const deadlineIsoString = deadlineText
      ? new Date(deadlineText).toISOString()
      : null;

    const salaryText =
      $el.find('.salary, .compensation, .pay').first().text().trim();
    let salaryMin = null,
      salaryMax = null,
      salaryCurrency = null;
    if (salaryText) {
      const currencyMatch = salaryText.match(/[\£\$\€\¥]/);
      salaryCurrency = currencyMatch ? currencyMatch[0] : null;
      const numbers = salaryText.match(/[\d,.]+/g);
      if (numbers) {
        const nums = numbers.map(n => parseFloat(n.replace(/[,]/g, '')));
        if (nums.length === 1) {
          salaryMin = salaryMax = nums[0];
        } else if (nums.length >= 2) {
          salaryMin = Math.min(...nums);
          salaryMax = Math.max(...nums);
        }
      }
    }

    const job = {
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
    };
    // Remove undefined/null keys
    Object.keys(job).forEach(k => (job[k] == null) && delete job[k]);
    result.push(job);
  });
}