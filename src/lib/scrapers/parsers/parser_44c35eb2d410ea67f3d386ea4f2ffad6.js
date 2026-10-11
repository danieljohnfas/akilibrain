// Identify possible job containers
let jobContainers = $('.job, .job-card, .posting, article.job, li.job-item, .career-item, .vacancy');

// Fallback: if no obvious containers, try to find sections with a title and description pattern
if (jobContainers.length === 0) {
  $('section, article, div').each((_, el) => {
    const $el = $(el);
    const hasTitle = $el.find('h1, h2, h3').first().text().trim().length > 0;
    const hasDesc = $el.find('p, .description, .job-description').first().text().trim().length > 0;
    if (hasTitle && hasDesc) jobContainers = jobContainers.add($el);
  });
}

// Process each container
jobContainers.each((_, elem) => {
  const $elem = $(elem);

  // Extract title
  const title = $elem.find('h1, h2, h3').first().text().trim();
  if (!title) return; // skip if no clear title

  // Extract other fields with common selectors
  const companyName = $elem.find('.company, .company-name, .employer').first().text().trim() || null;
  const description = $elem.find('.description, .job-description, .details, p').first().text().trim() || null;
  const location = $elem.find('.location, .job-location, .place').first().text().trim() || null;
  const typeText = $elem.find('.type, .job-type, .employment-type').first().text().trim().toLowerCase() || '';
  let jobType = null;
  if (/full\s*time/.test(typeText)) jobType = 'full_time';
  else if (/part\s*time/.test(typeText)) jobType = 'part_time';
  else if (/contract/.test(typeText)) jobType = 'contract';
  else if (/internship/.test(typeText)) jobType = 'internship';
  else if (/remote/.test(typeText)) jobType = 'remote';

  // Source URL – try to find a link inside the container or fallback to document URL
  let sourceUrl = $elem.find('a[href]').first().attr('href') || null;
  if (sourceUrl && !sourceUrl.startsWith('http')) {
    const base = $('base').attr('href') || '';
    sourceUrl = new URL(sourceUrl, base || window.location.href).href;
  }
  if (!sourceUrl) {
    sourceUrl = typeof window !== 'undefined' && window.location ? window.location.href : null;
  }

  // Dates
  const postedText = $elem.find('.posted, .date-posted, time[datetime]').first().attr('datetime') ||
                     $elem.find('.posted, .date-posted').first().text().trim();
  const deadlineText = $elem.find('.deadline, .date-deadline, time[datetime][class*="deadline"]').first().attr('datetime') ||
                       $elem.find('.deadline, .date-deadline').first().text().trim();

  const parseDate = txt => {
    if (!txt) return null;
    const d = new Date(txt);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const postedDateIsoString = parseDate(postedText);
  const deadlineIsoString = parseDate(deadlineText);

  // Salary extraction
  const salaryText = $elem.find('.salary, .pay, .compensation').first().text().trim();
  let salaryMin = null, salaryMax = null, salaryCurrency = null;
  if (salaryText) {
    const currencyMatch = salaryText.match(/[\$\£\€\¥]/);
    salaryCurrency = currencyMatch ? currencyMatch[0] : null;
    const numbers = salaryText.replace(/[^\d\.\-]/g, ' ').trim().split(/\s+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
    if (numbers.length === 1) {
      salaryMin = salaryMax = numbers[0];
    } else if (numbers.length >= 2) {
      salaryMin = Math.min(...numbers);
      salaryMax = Math.max(...numbers);
    }
  }

  // Build job object
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

  result.push(job);
});