const jobContainers = $('[itemtype="http://schema.org/JobPosting"], .job, .vacancy, .posting');
jobContainers.each(function () {
  const el = $(this);
  const title = el.find('[itemprop="title"], .title, h1, h2, h3').first().text().trim() ||
                el.attr('data-title') || '';
  if (!title) return;
  const companyName = el.find('[itemprop="hiringOrganization"], .company, .employer').first().text().trim() || '';
  const description = el.find('[itemprop="description"], .description, .desc').first().text().trim() || '';
  const location = el.find('[itemprop="jobLocation"], .location').first().text().trim() || '';
  const jobTypeRaw = el.find('[itemprop="employmentType"], .type').first().text().trim().toLowerCase() || '';
  let jobType = '';
  if (jobTypeRaw.includes('full')) jobType = 'full_time';
  else if (jobTypeRaw.includes('part')) jobType = 'part_time';
  else if (jobTypeRaw.includes('contract')) jobType = 'contract';
  else if (jobTypeRaw.includes('intern')) jobType = 'internship';
  else if (jobTypeRaw.includes('remote')) jobType = 'remote';
  const sourceUrl = el.find('a[href]').first().attr('href') || '';
  const postedDate = el.find('time[datetime]').first().attr('datetime') || '';
  const deadline = el.find('.deadline, [itemprop="validThrough"]').first().attr('datetime') ||
                   el.find('.deadline').first().text().trim();
  const salaryText = el.find('.salary, [itemprop="baseSalary"]').first().text().trim() || '';
  let salaryMin = null, salaryMax = null, salaryCurrency = null;
  if (salaryText) {
    const match = salaryText.match(/([A-Z]{3})?\s*([\d,]+)(?:\s*-\s*([A-Z]{3})?\s*([\d,]+))?/);
    if (match) {
      salaryCurrency = match[1] || match[3] || null;
      salaryMin = Number(match[2].replace(/,/g, '')) || null;
      salaryMax = match[4] ? Number(match[4].replace(/,/g, '')) : null;
    }
  }
  result.push({
    title,
    companyName,
    description,
    location,
    jobType,
    sourceUrl,
    postedDateIsoString: postedDate,
    deadlineIsoString: deadline,
    salaryMin,
    salaryMax,
    salaryCurrency
  });
});