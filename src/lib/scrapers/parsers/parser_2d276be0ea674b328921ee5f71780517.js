// Helper to safely trim strings
function cleanText(txt) {
  return (txt && typeof txt === 'string') ? txt.trim().replace(/\s+/g, ' ') : '';
}

// Helper to parse ISO date from common formats
function parseDate(str) {
  if (!str) return null;
  const iso = new Date(str);
  return isNaN(iso.getTime()) ? null : iso.toISOString();
}

// Helper to extract numeric salary and currency
function parseSalary(text) {
  if (!text) return {};
  const currencyMatch = text.match(/[$£€¥]/);
  const currency = currencyMatch ? currencyMatch[0] : null;
  const numbers = text.match(/[\d,]+/g);
  if (!numbers) return {};
  const nums = numbers.map(n => parseInt(n.replace(/,/g, ''), 10));
  return {
    salaryMin: Math.min(...nums),
    salaryMax: Math.max(...nums),
    salaryCurrency: currency
  };
}

// Find all anchor tags that likely point to a job detail page
const jobLinks = $('a[href]')
  .filter((i, el) => {
    const href = $(el).attr('href');
    // Consider links that contain "/jobs/" and are not just the current page
    return href && /\/jobs\/[^\/]+$/.test(href);
  });

if (jobLinks.length === 0) {
  // No identifiable job links – leave result empty
} else {
  jobLinks.each((i, link) => {
    const $link = $(link);
    const title = cleanText($link.text());
    if (!title) return; // skip if no title

    const sourceUrl = $link.attr('href');
    // Resolve relative URLs to absolute if possible
    const absoluteUrl = sourceUrl && !/^https?:\/\//i.test(sourceUrl)
      ? (new URL(sourceUrl, 'https://tanzania.un.org')).href
      : sourceUrl;

    // Find a container element that groups the job info
    const $container = $link.closest('article, .view-row, .views-row, .node, li, div')
      .first();

    // Extract optional fields from the container
    const description = cleanText($container.find('.field-body, .description, .node__content, p').first().text());

    const location = cleanText(
      $container.find('.field-location, .location, .job-location, .field-field-location')
        .first()
        .text()
    );

    const companyName = cleanText(
      $container.find('.field-company, .company, .field-field-agency')
        .first()
        .text()
    ) || 'United Nations';

    const typeText = cleanText(
      $container.find('.field-type, .job-type, .field-field-employment-type')
        .first()
        .text()
    ).toLowerCase();

    let jobType = null;
    if (/full[-\s]?time/.test(typeText)) jobType = 'full_time';
    else if (/part[-\s]?time/.test(typeText)) jobType = 'part_time';
    else if (/contract/.test(typeText)) jobType = 'contract';
    else if (/internship|intern/.test(typeText)) jobType = 'internship';
    else if (/remote/.test(typeText)) jobType = 'remote';

    const postedDateRaw = cleanText(
      $container.find('.field-posted, .posted-date, .field-field-posted-date')
        .first()
        .text()
    );
    const postedDateIsoString = parseDate(postedDateRaw);

    const deadlineRaw = cleanText(
      $container.find('.field-deadline, .deadline, .field-field-deadline')
        .first()
        .text()
    );
    const deadlineIsoString = parseDate(deadlineRaw);

    const salaryRaw = cleanText(
      $container.find('.field-salary, .salary, .field-field-salary')
        .first()
        .text()
    );
    const { salaryMin, salaryMax, salaryCurrency } = parseSalary(salaryRaw);

    // Assemble job object
    const job = {
      title,
      companyName,
      description,
      location,
      jobType,
      sourceUrl: absoluteUrl,
      postedDateIsoString,
      deadlineIsoString,
      salaryMin,
      salaryMax,
      salaryCurrency
    };

    // Remove undefined or null keys to keep the object tidy
    Object.keys(job).forEach(k => {
      if (job[k] === undefined || job[k] === null || job[k] === '') {
        delete job[k];
      }
    });

    result.push(job);
  });
}