// Identify potential job containers using common selectors
const containers = $('.job-listing, .vacancy, .job-item, article.post, .entry-content ul li, .wpb_wrapper > div').filter(function () {
  const $c = $(this);
  // Heuristic: must contain a probable title element with non‑empty text
  const hasTitle = $c.find('h1, h2, h3, a').first().text().trim().length > 0;
  // And should include at least one of keywords that indicate a posting
  const txt = $c.text().toLowerCase();
  const isJob = /full[-\s]?time|part[-\s]?time|contract|internship|volunteer|vacancy|position/.test(txt);
  return hasTitle && isJob;
});

containers.each(function () {
  const $c = $(this);

  // Title
  let title = $c.find('h1, h2, h3, a').first().text().trim();
  if (!title) return; // skip if no clear title

  // Company Name (optional)
  let companyName = $c.find('.company, .employer, .company-name').first().text().trim();
  if (!companyName) {
    // fallback: look for strong or bold text that is not the title
    const possible = $c.find('strong, b').filter((i, el) => $(el).text().trim() !== title).first().text().trim();
    if (possible) companyName = possible;
  }

  // Description
  let description = $c.find('.description, .entry-summary, p').map((i, el) => $(el).text().trim()).get().join(' ');
  if (!description) description = $c.text().trim();

  // Location
  let location = $c.find('.location, .job-location, .address').first().text().trim();

  // Job Type
  let jobTypeRaw = $c.find('.job-type, .type, .employment-type').first().text().toLowerCase();
  if (!jobTypeRaw) {
    const txt = $c.text().toLowerCase();
    if (/full[-\s]?time/.test(txt)) jobTypeRaw = 'full_time';
    else if (/part[-\s]?time/.test(txt)) jobTypeRaw = 'part_time';
    else if (/contract/.test(txt)) jobTypeRaw = 'contract';
    else if (/internship/.test(txt)) jobTypeRaw = 'internship';
    else if (/remote/.test(txt)) jobTypeRaw = 'remote';
    else if (/volunteer/.test(txt)) jobTypeRaw = 'volunteer';
  }
  const jobTypeMap = {
    'full time': 'full_time',
    'full-time': 'full_time',
    'part time': 'part_time',
    'part-time': 'part_time',
    'contract': 'contract',
    'internship': 'internship',
    'remote': 'remote',
    'volunteer': 'volunteer'
  };
  let jobType = jobTypeMap[jobTypeRaw] || (Object.keys(jobTypeMap).find(k => jobTypeRaw.includes(k)) ? jobTypeMap[Object.keys(jobTypeMap).find(k => jobTypeRaw.includes(k))] : '');

  // Source URL
  let sourceUrl = $c.find('a').filter((i, el) => $(el).attr('href')).first().attr('href') || '';

  // Posted date
  let postedDateIsoString = '';
  const postedAttr = $c.find('time[datetime]').first().attr('datetime') || $c.find('.posted, .date, .date-posted').first().text();
  if (postedAttr) {
    const d = new Date(postedAttr);
    if (!isNaN(d)) postedDateIsoString = d.toISOString();
  }

  // Deadline
  let deadlineIsoString = '';
  const deadlineTxt = $c.find('.deadline, .apply-by, .closing-date').first().text();
  if (deadlineTxt) {
    const d = new Date(deadlineTxt);
    if (!isNaN(d)) deadlineIsoString = d.toISOString();
  }

  // Salary
  let salaryMin = null;
  let salaryMax = null;
  let salaryCurrency = '';
  const salaryTxt = $c.find('.salary, .pay, .compensation').first().text();
  if (salaryTxt) {
    const currencyMatch = salaryTxt.match(/[\$€£¥]/);
    if (currencyMatch) salaryCurrency = currencyMatch[0];
    const numbers = salaryTxt.replace(/[^0-9\-.]/g, ' ').trim().split(/\s+/).map(n => parseFloat(n)).filter(n => !isNaN(n));
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
    companyName: companyName || undefined,
    description: description || undefined,
    location: location || undefined,
    jobType: jobType || undefined,
    sourceUrl: sourceUrl || undefined,
    postedDateIsoString: postedDateIsoString || undefined,
    deadlineIsoString: deadlineIsoString || undefined,
    salaryMin: salaryMin !== null ? salaryMin : undefined,
    salaryMax: salaryMax !== null ? salaryMax : undefined,
    salaryCurrency: salaryCurrency || undefined
  };

  result.push(job);
});