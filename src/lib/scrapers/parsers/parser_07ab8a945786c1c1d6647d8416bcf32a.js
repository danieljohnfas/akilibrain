const jobElements = $('a[href*="/jobs/"], a[href*="/career/"], a[href*="/job/"]').filter(function () {
  const text = $(this).text().trim();
  return text && text.length < 200 && /engineer|developer|manager|designer|analyst|consultant|intern|lead|senior|junior/i.test(text);
});

jobElements.each(function () {
  const link = $(this);
  const title = link.text().trim() || null;
  const sourceUrl = link.attr('href') ? (link.attr('href').startsWith('http') ? link.attr('href') : (typeof window !== 'undefined' && window.location ? window.location.origin + link.attr('href') : link.attr('href'))) : null;

  const container = link.closest('.job-item, .job-listing, .career-item, .listing, article, .card, .col, .row');
  const description = container.find('.description, .job-description, p').first().text().trim() || null;
  const location = container.find('.location, .job-location, .place').first().text().trim() || null;
  const typeText = container.find('.type, .job-type, .employment-type').first().text().trim().toLowerCase() || '';
  let jobType = null;
  if (/full[-\s]?time/.test(typeText)) jobType = 'full_time';
  else if (/part[-\s]?time/.test(typeText)) jobType = 'part_time';
  else if (/contract/.test(typeText)) jobType = 'contract';
  else if (/intern/.test(typeText)) jobType = 'internship';
  else if (/remote/.test(typeText)) jobType = 'remote';

  const posted = container.find('time[datetime], .posted, .date-posted').first().attr('datetime') ||
                 container.find('time, .posted, .date-posted').first().text().trim() || null;
  const deadline = container.find('time[datetime][class*="deadline"], .deadline').first().attr('datetime') ||
                   container.find('.deadline').first().text().trim() || null;

  const salaryText = container.find('.salary, .compensation').first().text().trim();
  let salaryMin = null, salaryMax = null, salaryCurrency = null;
  if (salaryText) {
    const currencyMatch = salaryText.match(/[\$€£¥]/);
    salaryCurrency = currencyMatch ? currencyMatch[0] : null;
    const numbers = salaryText.replace(/[^0-9\.\-]/g, ' ').trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
    if (numbers.length === 1) {
      salaryMin = salaryMax = numbers[0];
    } else if (numbers.length >= 2) {
      salaryMin = Math.min(...numbers);
      salaryMax = Math.max(...numbers);
    }
  }

  const company = container.find('.company, .employer, .org-name').first().text().trim() || null;

  result.push({
    title: title || null,
    companyName: company,
    description: description,
    location: location,
    jobType: jobType,
    sourceUrl: sourceUrl,
    postedDateIsoString: posted || null,
    deadlineIsoString: deadline || null,
    salaryMin: salaryMin,
    salaryMax: salaryMax,
    salaryCurrency: salaryCurrency
  });
});