const jobSelectors = [
  '.job-card',
  '.job-listing',
  '.job-item',
  'article.job',
  'li.job',
  '[data-job-id]',
  '[role="listitem"]'
];

function extractText(elem, selectors) {
  for (const sel of selectors) {
    const found = $(elem).find(sel).first();
    if (found && found.text().trim()) return found.text().trim();
  }
  return null;
}

function parseSalary(str) {
  if (!str) return {};
  const match = str.replace(/,/g, '').match(/([A-Za-z]{3,})?\s*([\d]+)(?:\s*-\s*([\d]+))?/);
  if (!match) return {};
  const currency = match[1] ? match[1].trim() : null;
  const min = Number(match[2]) || null;
  const max = match[3] ? Number(match[3]) : null;
  return { salaryCurrency: currency, salaryMin: min, salaryMax: max };
}

for (const selector of jobSelectors) {
  $(selector).each((_, elem) => {
    const title = extractText(elem, ['h1', 'h2', 'h3', '.title', '.job-title', '.job-name']);
    if (!title) return; // skip if no clear title

    const companyName = extractText(elem, ['.company', '.company-name', '.employer']);
    const location = extractText(elem, ['.location', '.job-location', '.city']);
    const description = extractText(elem, ['.description', '.job-description', 'p']);
    const typeText = extractText(elem, ['.type', '.job-type', '.employment-type']);
    let jobType = null;
    if (typeText) {
      const lower = typeText.toLowerCase();
      if (lower.includes('full')) jobType = 'full_time';
      else if (lower.includes('part')) jobType = 'part_time';
      else if (lower.includes('contract')) jobType = 'contract';
      else if (lower.includes('intern')) jobType = 'internship';
      else if (lower.includes('remote')) jobType = 'remote';
    }

    const sourceUrl = extractText(elem, ['a.source', 'a[href]']) || (typeof window !== 'undefined' && window.location?.href) || null;
    const posted = extractText(elem, ['time.posted', '.posted-date', '.date']);
    const deadline = extractText(elem, ['time.deadline', '.deadline', '.apply-by']);

    const salaryInfo = parseSalary(extractText(elem, ['.salary', '.pay', '.compensation']));

    const job = {
      title,
      companyName,
      location,
      description,
      jobType,
      sourceUrl,
      postedDateIsoString: posted ? new Date(posted).toISOString() : null,
      deadlineIsoString: deadline ? new Date(deadline).toISOString() : null,
      salaryMin: salaryInfo.salaryMin || null,
      salaryMax: salaryInfo.salaryMax || null,
      salaryCurrency: salaryInfo.salaryCurrency || null
    };
    result.push(job);
  });
}

// If no jobs were found, ensure result stays an empty array (already satisfied).