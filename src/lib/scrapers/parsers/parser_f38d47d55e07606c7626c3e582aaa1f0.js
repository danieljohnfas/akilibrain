var jobContainers = $('article.job, .job-listing, .job-item, li.job, .entry-content > .job, .job-posting');
jobContainers.each(function(i, el){
  var $el = $(el);
  var title = $el.find('h2.job-title, h3.job-title, .title, a.job-title').first().text().trim();
  if(!title) return;
  var companyName = $el.find('.company-name, .company, .employer').first().text().trim();
  var location = $el.find('.location, .job-location').first().text().trim();
  var description = $el.find('.description, .job-description, .summary').first().text().trim();
  var jobTypeText = $el.find('.job-type, .employment-type').first().text().trim().toLowerCase();
  var jobType = '';
  if(jobTypeText.includes('full')) jobType = 'full_time';
  else if(jobTypeText.includes('part')) jobType = 'part_time';
  else if(jobTypeText.includes('contract')) jobType = 'contract';
  else if(jobTypeText.includes('intern')) jobType = 'internship';
  else if(jobTypeText.includes('remote')) jobType = 'remote';
  var sourceUrl = $el.find('a.job-link, a.title').first().attr('href') || '';
  var postedDateText = $el.find('.posted-date, .date').first().text().trim();
  var postedDateIsoString = postedDateText ? new Date(postedDateText).toISOString() : '';
  var deadlineText = $el.find('.deadline, .expires').first().text().trim();
  var deadlineIsoString = deadlineText ? new Date(deadlineText).toISOString() : '';
  var salaryText = $el.find('.salary, .job-salary').first().text().trim();
  var salaryMin = null, salaryMax = null, salaryCurrency = '';
  if(salaryText){
    var rangeMatch = salaryText.match(/([\d,\s]+)\s*[-–]\s*([\d,\s]+)\s*(\S+)/);
    if(rangeMatch){
      salaryMin = parseFloat(rangeMatch[1].replace(/[,\s]/g,''));
      salaryMax = parseFloat(rangeMatch[2].replace(/[,\s]/g,''));
      salaryCurrency = rangeMatch[3];
    }else{
      var singleMatch = salaryText.match(/([\d,\s]+)\s*(\S+)/);
      if(singleMatch){
        salaryMin = salaryMax = parseFloat(singleMatch[1].replace(/[,\s]/g,''));
        salaryCurrency = singleMatch[2];
      }
    }
  }
  var job = {
    title: title,
    companyName: companyName,
    description: description,
    location: location,
    jobType: jobType,
    sourceUrl: sourceUrl,
    postedDateIsoString: postedDateIsoString,
    deadlineIsoString: deadlineIsoString,
    salaryMin: salaryMin,
    salaryMax: salaryMax,
    salaryCurrency: salaryCurrency
  };
  result.push(job);
});