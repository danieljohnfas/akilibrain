// Identify possible job containers by looking for a title and a link to a job detail page
const jobContainers = $('.job-card, .job-item, .listing, .result-card, .card, .search-result')
  .filter(function () {
    const $c = $(this);
    const titleText = $c.find('h1, h2, h3, .title, .job-title, a[data-testid="job-title"]').first().text().trim();
    const linkHref = $c.find('a[href*="/jobs/"], a[href*="?job="]').first().attr('href') || '';
    return titleText && /\/jobs\//.test(linkHref);
  });

if (jobContainers.length) {
  const baseUrl = $('meta[property="og:url"]').attr('content') || '';

  jobContainers.each(function () {
    const $c = $(this);

    // Title
    const title = $c.find('h1, h2, h3, .title, .job-title, a[data-testid="job-title"]').first().text().trim();

    if (!title) return; // skip if no clear title

    // Company name
    const companyName = $c.find('.company, .company-name, .employer, .posted-by').first().text().trim() || null;

    // Description (short excerpt)
    const description = $c.find('.description, .job-description, .summary, p').first().text().trim() || null;

    // Location
    const location = $c.find('.location, .job-location, .place').first().text().trim() || null;

    // Job type detection
    const typeText = $c.find('.type, .job-type, .employment-type').first().text().toLowerCase();
    let jobType = null;
    if (/full\s*time/.test(typeText)) jobType = 'full_time';
    else if (/part\s*time/.test(typeText)) jobType = 'part_time';
    else if (/contract/.test(typeText)) jobType = 'contract';
    else if (/internship/.test(typeText)) jobType = 'internship';
    else if (/remote/.test(typeText)) jobType = 'remote';

    // Source URL
    let sourceUrl = $c.find('a[href*="/jobs/"], a[href*="?job="]').first().attr('href') || null;
    if (sourceUrl && sourceUrl.startsWith('/')) {
      sourceUrl = baseUrl.replace(/\/$/, '') + sourceUrl;
    }

    // Posted date
    let postedDateIsoString = null;
    const postedAttr = $c.find('time[datetime]').first().attr('datetime');
    if (postedAttr) postedDateIsoString = new Date(postedAttr).toISOString();

    // Deadline
    let deadlineIsoString = null;
    const deadlineText = $c.find('.deadline, .apply-by, .closing-date').first().text();
    const deadlineMatch = deadlineText && deadlineText.match(/(\d{4}[\/-]\d{2}[\/-]\d{2})/);
    if (deadlineMatch) deadlineIsoString = new Date(deadlineMatch[1]).toISOString();

    // Salary parsing
    let salaryMin = null;
    let salaryMax = null;
    let salaryCurrency = null;
    const salaryText = $c.find('.salary, .pay, .compensation').first().text();
    if (salaryText) {
      const currencyMatch = salaryText.match(/[\$€£¥]/);
      if (currencyMatch) salaryCurrency = currencyMatch[0];
      const numbers = salaryText.match(/[\d.,]+/g);
      if (numbers && numbers.length) {
        const clean = (s) => Number(s.replace(/[,]/g, '').replace(/[^\d.]/g, ''));
        if (numbers.length === 1) {
          salaryMin = salaryMax = clean(numbers[0]);
        } else if (numbers.length >= 2) {
          salaryMin = clean(numbers[0]);
          salaryMax = clean(numbers[1]);
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