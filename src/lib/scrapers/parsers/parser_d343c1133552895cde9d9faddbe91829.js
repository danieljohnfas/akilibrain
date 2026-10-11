const jobContainers = $('.job, .job-listing, .posting, .vacancy, .career-item, .position');
jobContainers.each((_, el) => {
  const container = $(el);
  const title = container.find('.title, h1, h2, h3, .job-title').first().text().trim();
  if (!title) return;
  const job = {
    title,
    companyName: container.find('.company, .employer').first().text().trim() || undefined,
    description: container.find('.description, .job-description, p').first().text().trim() || undefined,
    location: container.find('.location, .job-location').first().text().trim() || undefined,
    jobType: (function() {
      const txt = container.find('.type, .job-type').first().text().toLowerCase();
      if (txt.includes('full')) return 'full_time';
      if (txt.includes('part')) return 'part_time';
      if (txt.includes('contract')) return 'contract';
      if (txt.includes('intern')) return 'internship';
      if (txt.includes('remote')) return 'remote';
      return undefined;
    })(),
    sourceUrl: container.find('a').first().attr('href') || undefined,
    postedDateIsoString: undefined,
    deadlineIsoString: undefined,
    salaryMin: undefined,
    salaryMax: undefined,
    salaryCurrency: undefined
  };
  result.push(job);
});