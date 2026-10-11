let containers = $('.job, .job-item, .job-listing, .posting, .vacancy, .career-item'); 
containers.each(function(){ 
  const elem = $(this); 
  const title = elem.find('h1, h2, h3, .title, a.title, a').first().text().trim(); 
  if(!title) return; 
  const job = {title}; 
  const company = elem.find('.company, .company-name').first().text().trim(); 
  if(company) job.companyName = company; 
  const desc = elem.find('.description, .desc, p').first().text().trim(); 
  if(desc) job.description = desc; 
  const loc = elem.find('.location, .loc').first().text().trim(); 
  if(loc) job.location = loc; 
  const typeText = elem.find('.type, .job-type').first().text().toLowerCase().trim(); 
  if(typeText){ 
    const map = {full:'full_time', 'full time':'full_time','part':'part_time','part time':'part_time','contract':'contract','intern':'internship','internship':'internship','remote':'remote'}; 
    const key = Object.keys(map).find(k=>typeText.includes(k)); 
    if(key) job.jobType = map[key]; 
  } 
  const url = elem.find('a').first().attr('href'); 
  if(url) job.sourceUrl = url; 
  const postedAttr = elem.find('time[datetime]').first().attr('datetime'); 
  const postedText = postedAttr || elem.find('.posted, .date-posted').first().text().trim(); 
  if(postedText){ 
    const iso = new Date(postedText).toISOString(); 
    if(!isNaN(Date.parse(iso))) job.postedDateIsoString = iso; 
  } 
  const deadlineText = elem.find('.deadline, .apply-by').first().text().trim(); 
  if(deadlineText){ 
    const iso = new Date(deadlineText).toISOString(); 
    if(!isNaN(Date.parse(iso))) job.deadlineIsoString = iso; 
  } 
  const salaryText = elem.find('.salary').first().text().trim(); 
  if(salaryText){ 
    const match = salaryText.match(/([A-Z]{3})?\s?([\d,]+)\s?-?\s*([A-Z]{3})?\s?([\d,]+)/); 
    if(match){ 
      const cur1 = match[1]||match[3]||''; 
      const cur2 = match[3]||match[1]||''; 
      const min = parseInt(match[2].replace(/,/g,'')); 
      const max = parseInt(match[4].replace(/,/g,'')); 
      if(!isNaN(min)) job.salaryMin = min; 
      if(!isNaN(max)) job.salaryMax = max; 
      job.salaryCurrency = cur1||cur2||''; 
    } 
  } 
  result.push(job); 
});