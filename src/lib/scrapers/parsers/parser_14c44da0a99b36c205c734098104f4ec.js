const jobContainers = $('.job, .job-listing, .vacancy, .career-item, article.job, .post');
jobContainers.each(function(){
  const el = $(this);
  const title = el.find('h1, h2, h3, .title, .job-title').first().text().trim();
  if (!title) return;
  const company = el.find('.company, .company-name').first().text().trim();
  const description = el.find('.description, .job-description, p').text().trim();
  const location = el.find('.location, .job-location').first().text().trim();
  const typeText = el.find('.type, .job-type').first().text().toLowerCase();
  let jobType;
  if (typeText.includes('full')) jobType = 'full_time';
  else if (typeText.includes('part')) jobType = 'part_time';
  else if (typeText.includes('contract')) jobType = 'contract';
  else if (typeText.includes('intern')) jobType = 'internship';
  else if (typeText.includes('remote')) jobType = 'remote';
  const sourceUrl = $('link[rel=canonical]').attr('href') || '';
  const posted = el.find('.posted, time[datetime]').first().attr('datetime') || '';
  const deadline = el.find('.deadline, .apply-by').first().attr('datetime') || '';
  const salaryText = el.find('.salary').first().text();
  let salaryMin, salaryMax, salaryCurrency;
  if (salaryText){
    const match = salaryText.replace(/,/g,'').match(/([A-Z]{3})?\s?(\d+)(?:\s?-\s?(\d+))?/);
    if (match){
      salaryCurrency = match[1] || '';
      salaryMin = Number(match[2]) || null;
      salaryMax = match[3] ? Number(match[3]) : null;
    }
  }
  result.push({
    title,
    companyName: company || undefined,
    description: description || undefined,
    location: location || undefined,
    jobType: jobType || undefined,
    sourceUrl,
    postedDateIsoString: posted || undefined,
    deadlineIsoString: deadline || undefined,
    salaryMin: salaryMin !== undefined ? salaryMin : undefined,
    salaryMax: salaryMax !== undefined ? salaryMax : undefined,
    salaryCurrency: salaryCurrency || undefined
  });
});