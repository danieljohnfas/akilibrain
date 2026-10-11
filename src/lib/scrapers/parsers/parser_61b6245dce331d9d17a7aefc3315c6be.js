let containers = $('article'); 
if (containers.length === 0) containers = $('div.post'); 
containers.each(function(){ 
  const elem = $(this); 
  const title = elem.find('h1, .entry-title, .job-title').first().text().trim(); 
  if (!title) return; 
  const description = elem.find('.entry-content, .post-content, .content').first().text().trim() || elem.text().trim(); 
  const companyMeta = $('meta[name="author"]').attr('content') || ''; 
  const companyName = elem.find('.company, .company-name, .author, .byline').first().text().trim() || companyMeta.trim(); 
  const rawText = elem.text(); 
  let location = ''; 
  const locMatch = rawText.match(/Location[:\s]*([^\n\r]+)/i); 
  if (locMatch) location = locMatch[1].trim(); 
  let jobType = ''; 
  const typeMap = { 
    full_time: ['full[-\\s]?time','fulltime'], 
    part_time: ['part[-\\s]?time','parttime'], 
    contract: ['contract'], 
    internship: ['internship','intern'], 
    remote: ['remote'] 
  }; 
  outer: for (const [key, patterns] of Object.entries(typeMap)) { 
    for (const pat of patterns) { 
      if (new RegExp(pat,'i').test(rawText)) { 
        jobType = key; 
        break outer; 
      } 
    } 
  } 
  let postedDateIsoString = ''; 
  const timeElem = elem.find('time[datetime]').first(); 
  if (timeElem.length) { 
    postedDateIsoString = new Date(timeElem.attr('datetime')).toISOString(); 
  } else { 
    const metaPub = $('meta[property="article:published_time"]').attr('content'); 
    if (metaPub) postedDateIsoString = new Date(metaPub).toISOString(); 
  } 
  let deadlineIsoString = ''; 
  const deadlineMatch = rawText.match(/Deadline[:\s]*([^\n\r]+)/i); 
  if (deadlineMatch) { 
    const d = new Date(deadlineMatch[1].trim()); 
    if (!isNaN(d)) deadlineIsoString = d.toISOString(); 
  } 
  let salaryMin = null, salaryMax = null, salaryCurrency = null; 
  const salaryMatch = rawText.match(/([£$€])\s?([\d,]+)(?:\s?-\s?([£$€])?\s?([\d,]+))?/); 
  if (salaryMatch) { 
    salaryCurrency = salaryMatch[1]; 
    salaryMin = parseInt(salaryMatch[2].replace(/,/g,''),10); 
    if (salaryMatch[3] && salaryMatch[4]) { 
      salaryMax = parseInt(salaryMatch[4].replace(/,/g,''),10); 
      if (!salaryCurrency && salaryMatch[3]) salaryCurrency = salaryMatch[3]; 
    } else { 
      salaryMax = salaryMin; 
    } 
  } 
  const sourceUrl = $('meta[property="og:url"]').attr('content') || ''; 
  const job = { 
    title, 
    companyName, 
    description, 
    location, 
    jobType, 
    sourceUrl, 
    postedDateIsoString, 
    deadlineIsoString, 
    salaryMin, 
    salaryMax, 
    salaryCurrency 
  }; 
  result.push(job); 
});