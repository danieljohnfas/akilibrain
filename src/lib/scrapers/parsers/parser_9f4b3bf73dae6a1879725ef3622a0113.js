const jobSelectors = [
  '.job-card',
  '.job-item',
  '.listing',
  'article[data-job-id]',
  'article.job',
  'li.job',
  'div.job'
];

const titleSelectors = [
  'h1',
  'h2',
  '.title',
  '.job-title',
  '.job__title',
  'a.title',
  'a.job-title'
];

const companySelectors = [
  '.company',
  '.company-name',
  '.employer',
  '.job-company',
  '.company__name'
];

const locationSelectors = [
  '.location',
  '.job-location',
  '.address',
  '.city'
];

const typeSelectors = [
  '.type',
  '.job-type',
  '.employment-type'
];

const descriptionSelectors = [
  '.description',
  '.job-description',
  '.summary',
  '.content'
];

const salarySelectors = [
  '.salary',
  '.compensation',
  '.pay',
  '.salary-range'
];

const datePostedSelectors = [
  '.date-posted',
  '.posted',
  '.publish-date',
  '.job-date'
];

const deadlineSelectors = [
  '.deadline',
  '.apply-by',
  '.closing-date'
];

function getFirstText(root, selectors) {
  for (const sel of selectors) {
    const txt = root.find(sel).first().text().trim();
    if (txt) return txt;
  }
  return '';
}

function getFirstAttr(root, selectors, attr) {
  for (const sel of selectors) {
    const val = root.find(sel).first().attr(attr);
    if (val) return val.trim();
  }
  return '';
}

function parseSalary(text) {
  const result = { min: null, max: null, currency: null };
  if (!text) return result;
  const currencyMatch = text.match(/[\$€£¥₹]/);
  if (currencyMatch) result.currency = currencyMatch[0];
  const numbers = text.match(/[\d,]+/g);
  if (numbers) {
    const clean = n => parseInt(n.replace(/,/g, ''), 10);
    if (numbers.length === 1) {
      result.min = result.max = clean(numbers[0]);
    } else if (numbers.length >= 2) {
      result.min = clean(numbers[0]);
      result.max = clean(numbers[1]);
    }
  }
  return result;
}

function parseDate(text) {
  if (!text) return null;
  const d = new Date(text);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

let found = false;

for (const containerSel of jobSelectors) {
  $(containerSel).each((_, elem) => {
    const $job = $(elem);
    const title = getFirstText($job, titleSelectors);
    if (!title) return; // not a real job entry

    found = true;

    const companyName = getFirstText($job, companySelectors);
    const location = getFirstText($job, locationSelectors);
    const jobTypeRaw = getFirstText($job, typeSelectors).toLowerCase();
    let jobType = null;
    if (jobTypeRaw.includes('full')) jobType = 'full_time';
    else if (jobTypeRaw.includes('part')) jobType = 'part_time';
    else if (jobTypeRaw.includes('contract')) jobType = 'contract';
    else if (jobTypeRaw.includes('intern')) jobType = 'internship';
    else if (jobTypeRaw.includes('remote')) jobType = 'remote';

    const description = getFirstText($job, descriptionSelectors);
    const sourceUrl = getFirstAttr($job, ['a'], 'href') || null;

    const postedDateIsoString = parseDate(getFirstText($job, datePostedSelectors));
    const deadlineIsoString = parseDate(getFirstText($job, deadlineSelectors));

    const salaryText = getFirstText($job, salarySelectors);
    const { min, max, currency } = parseSalary(salaryText);

    const jobObj = {
      title,
      companyName: companyName || null,
      description: description || null,
      location: location || null,
      jobType: jobType || null,
      sourceUrl: sourceUrl ? new URL(sourceUrl, window.location.href).href : null,
      postedDateIsoString: postedDateIsoString,
      deadlineIsoString: deadlineIsoString,
      salaryMin: min,
      salaryMax: max,
      salaryCurrency: currency
    };

    result.push(jobObj);
  });
  if (found) break;
}

// If no job containers were found, result remains empty as required.