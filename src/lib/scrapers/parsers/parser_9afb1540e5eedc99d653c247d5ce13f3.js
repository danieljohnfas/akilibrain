let containers = $('.job, .job-listing, .posting, .vacancy, .career-item'); 
containers.each(function(){ 
  let el = $(this); 
  let title = el.find('h1, h2, h3, a, .title').first().text().trim(); 
  if(!title) return; 
  let job = {title}; 
  let company = el.find('.company, .company-name, .employer').first().text().trim(); 
  if(company) job.companyName = company; 
  let description = el.find('.description, .job-desc, p').first().text().trim(); 
  if(description) job.description = description; 
  let location = el.find('.location, .job-location').first().text().trim(); 
  if(location) job.location = location; 
  let type = el.find('.type, .job-type').first().text().trim().toLowerCase(); 
  if(type){ 
    if(/full.?time/.test(type)) job.jobType='full_time'; 
    else if(/part.?time/.test(type)) job.jobType='part_time'; 
    else if(/contract/.test(type)) job.jobType='contract'; 
    else if(/intern/.test(type)) job.jobType='internship'; 
    else if(/remote/.test(type)) job.jobType='remote'; 
  } 
  let source = el.find('a.source, a[href]').first().attr('href'); 
  if(source) job.sourceUrl = source; 
  let posted = el.find('.posted, time[datetime]').first().attr('datetime') || el.find('.posted').first().text().trim(); 
  if(posted) job.postedDateIsoString = new Date(posted).toISOString(); 
  let deadline = el.find('.deadline, .apply-by').first().attr('datetime') || el.find('.deadline').first().text().trim(); 
  if(deadline) job.deadlineIsoString = new Date(deadline).toISOString(); 
  let salaryText = el.find('.salary, .compensation').first().text().trim(); 
  if(salaryText){ 
    let match = salaryText.match(/([A-Z]{3})?\s*([0-9,.]+)\s*(?:-|\sto\s)\s*([0-9,.]+)?/i); 
    if(match){ 
      if(match[1]) job.salaryCurrency = match[1]; 
      if(match[2]) job.salaryMin = parseFloat(match[2].replace(/,/g,'')); 
      if(match[3]) job.salaryMax = parseFloat(match[3].replace(/,/g,'')); 
    } 
  } 
  result.push(job); 
});