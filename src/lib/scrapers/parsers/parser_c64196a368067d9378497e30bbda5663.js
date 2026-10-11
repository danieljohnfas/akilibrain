var containers = $('.job, .job-listing, .posting, .vacancy, .career-item');
containers.each(function(){
  var elem = $(this);
  var title = elem.find('h1, h2, h3, .title, .job-title').first().text().trim();
  if (!title) return;
  var job = {
    title: title,
    companyName: elem.find('.company, .company-name').first().text().trim() || undefined,
    description: elem.find('.description, .job-description, p').first().text().trim() || undefined,
    location: elem.find('.location, .job-location').first().text().trim() || undefined,
    jobType: (function(){
      var txt = elem.find('.type, .job-type').first().text().toLowerCase();
      if (txt.includes('full')) return 'full_time';
      if (txt.includes('part')) return 'part_time';
      if (txt.includes('contract')) return 'contract';
      if (txt.includes('intern')) return 'internship';
      if (txt.includes('remote')) return 'remote';
      return undefined;
    })(),
    sourceUrl: undefined,
    postedDateIsoString: undefined,
    deadlineIsoString: undefined,
    salaryMin: undefined,
    salaryMax: undefined,
    salaryCurrency: undefined
  };
  result.push(job);
});