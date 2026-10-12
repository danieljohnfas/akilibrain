// Extract base URL for source reference
const sourceUrl = $('link[rel="canonical"]').attr('href') || '';

$("[itemtype='http://schema.org/JobPosting']").each((_, container) => {
  const el = $(container);

  // Title is mandatory for a job entry
  const title = (el.find("[itemprop='title']").first().text() || el.find("[itemprop='title']").first().attr('content') || '').trim();
  if (!title) return;

  const job = {
    title,
    sourceUrl,
  };

  // Optional fields
  const company = (el.find("[itemprop='hiringOrganization'] [itemprop='name']").first().text() ||
                  el.find("[itemprop='hiringOrganization']").first().attr('content') ||
                  '').trim();
  if (company) job.companyName = company;

  const description = (el.find("[itemprop='description']").first().text() ||
                       el.find("[itemprop='description']").first().attr('content') ||
                       '').trim();
  if (description) job.description = description;

  const location = (el.find("[itemprop='jobLocation'] [itemprop='addressLocality']").first().text() ||
                    el.find("[itemprop='jobLocation']").first().attr('content') ||
                    '').trim();
  if (location) job.location = location;

  const employmentType = (el.find("[itemprop='employmentType']").first().text() ||
                          el.find("[itemprop='employmentType']").first().attr('content') ||
                          '').trim().toLowerCase();
  if (employmentType) {
    const map = {
      'fulltime': 'full_time',
      'full-time': 'full_time',
      'parttime': 'part_time',
      'part-time': 'part_time',
      'contract': 'contract',
      'internship': 'internship',
      'intern': 'internship',
      'temporary': 'contract',
      'remote': 'remote',
    };
    job.jobType = map[employmentType.replace(/\s+/g, '')] || employmentType;
  }

  const posted = (el.find("[itemprop='datePosted']").first().attr('content') ||
                  el.find("[itemprop='datePosted']").first().text()).trim();
  if (posted) {
    const iso = new Date(posted).toISOString();
    if (!isNaN(Date.parse(iso))) job.postedDateIsoString = iso;
  }

  const deadline = (el.find("[itemprop='validThrough']").first().attr('content') ||
                    el.find("[itemprop='validThrough']").first().text()).trim();
  if (deadline) {
    const iso = new Date(deadline).toISOString();
    if (!isNaN(Date.parse(iso))) job.deadlineIsoString = iso;
  }

  // Salary handling – supports both simple text and structured meta tags
  const salaryEl = el.find("[itemprop='baseSalary']").first();
  if (salaryEl.length) {
    const value = salaryEl.find("[itemprop='value']").first();
    const amount = value.find("[itemprop='minValue']").first().attr('content') ||
                   value.find("[itemprop='minValue']").first().text() ||
                   value.attr('content') ||
                   value.text();
    const maxAmount = value.find("[itemprop='maxValue']").first().attr('content') ||
                      value.find("[itemprop='maxValue']").first().text();
    const currency = value.find("[itemprop='currency']").first().attr('content') ||
                     value.find("[itemprop='currency']").first().text();

    if (amount) {
      const min = parseFloat(amount.replace(/[^\d.]/g, ''));
      if (!isNaN(min)) job.salaryMin = min;
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount.replace(/[^\d.]/g, ''));
      if (!isNaN(max)) job.salaryMax = max;
    }
    if (currency) job.salaryCurrency = currency.trim();
  } else {
    // Fallback: try plain text like "$40k - $60k"
    const salaryText = salaryEl.text().trim() || el.text().match(/[\$£€]\s?\d[\d,.\s]*[kKmM]?/g);
    if (salaryText && typeof salaryText === 'string') {
      const match = salaryText.replace(/[^\d.,kKmM]/g, '').match(/(\d+(?:[.,]\d+)?)([kKmM]?)/);
      if (match) {
        let value = parseFloat(match[1].replace(',', '.'));
        const unit = match[2].toLowerCase();
        if (unit === 'k') value *= 1000;
        if (unit === 'm') value *= 1000000;
        if (!isNaN(value)) job.salaryMin = value;
      }
    }
  }

  result.push(job);
});