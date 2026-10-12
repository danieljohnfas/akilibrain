// Find candidate job links based on typical job‑detail URL patterns
const jobLinkSelector = 'a[href]';
const jobHrefPattern = /\/(jobs?|vacancies?|position|detail|listing)\/|job[-_]?id|\/\d{4,}/i;

const seen = new Set();

$('body')
  .find(jobLinkSelector)
  .filter((_, el) => {
    const href = $(el).attr('href');
    return href && jobHrefPattern.test(href);
  })
  .each((_, el) => {
    const $link = $(el);
    const href = $link.attr('href');
    if (seen.has(href)) return;
    seen.add(href);

    // Determine the most probable container for the job info
    const $container = $link.closest(
      '.job-card,.job-item,.vacancy,.listing,.card,.job,.article,.col,.row,article,li,div'
    );

    // Title – required to consider this a real job posting
    const title = $link.text().trim();
    if (!title) return; // skip if no clear title

    // Helper to clean extracted text
    const clean = (txt) => (txt ? txt.replace(/\s+/g, ' ').trim() : null);

    // Company name
    const companyName = clean(
      $container
        .find('.company,.employer,.org,.company-name,.publisher')
        .first()
        .text()
    );

    // Location
    const location = clean(
      $container.find('.location,.job-location,.loc,.place').first().text()
    );

    // Description / summary
    const description = clean(
      $container.find('.description,.job-desc,.summary,p').first().text()
    );

    // Job type detection
    const typeText = clean(
      $container
        .find('.type,.job-type,.employment-type')
        .first()
        .text()
        .toLowerCase()
    );
    let jobType = null;
    if (typeText) {
      if (/full\s*time/.test(typeText)) jobType = 'full_time';
      else if (/part\s*time/.test(typeText)) jobType = 'part_time';
      else if (/contract/.test(typeText)) jobType = 'contract';
      else if (/internship|intern/.test(typeText)) jobType = 'internship';
      else if (/remote/.test(typeText)) jobType = 'remote';
    }

    // Salary extraction (e.g., "TZS 1,000,000 - 1,500,000")
    const salaryText = clean(
      $container.find('.salary,.pay,.compensation').first().text()
    );
    let salaryMin = null,
      salaryMax = null,
      salaryCurrency = null;
    if (salaryText) {
      const currencyMatch = salaryText.match(/([A-Za-z$€£₹]+)\s*/);
      if (currencyMatch) salaryCurrency = currencyMatch[1].trim();
      const numbers = salaryText
        .replace(/[^\d\-.]/g, ' ')
        .trim()
        .split(/\s+/)
        .map((n) => parseFloat(n.replace(/,/g, '')))
        .filter((n) => !isNaN(n));
      if (numbers.length) {
        salaryMin = numbers[0];
        salaryMax = numbers.length > 1 ? numbers[1] : numbers[0];
      }
    }

    // Posted date
    const postedRaw = clean(
      $container
        .find('time[datetime], .posted, .date-posted')
        .first()
        .attr('datetime') ||
        $container.find('.posted,.date-posted').first().text()
    );
    const postedDateIsoString = postedRaw
      ? new Date(postedRaw).toISOString()
      : null;

    // Application deadline
    const deadlineRaw = clean(
      $container
        .find('time[datetime].deadline, .deadline, .apply-by')
        .first()
        .attr('datetime') ||
        $container.find('.deadline,.apply-by').first().text()
    );
    const deadlineIsoString = deadlineRaw
      ? new Date(deadlineRaw).toISOString()
      : null;

    // Resolve absolute URL for source
    const sourceUrl = new URL(href, 'https://www.ajiramarket.co.tz').href;

    // Build job object (only include fields that were found)
    const job = { title };
    if (companyName) job.companyName = companyName;
    if (description) job.description = description;
    if (location) job.location = location;
    if (jobType) job.jobType = jobType;
    if (sourceUrl) job.sourceUrl = sourceUrl;
    if (postedDateIsoString) job.postedDateIsoString = postedDateIsoString;
    if (deadlineIsoString) job.deadlineIsoString = deadlineIsoString;
    if (salaryMin !== null) job.salaryMin = salaryMin;
    if (salaryMax !== null) job.salaryMax = salaryMax;
    if (salaryCurrency) job.salaryCurrency = salaryCurrency;

    result.push(job);
  });

// If no valid job titles were found, result remains empty as required.