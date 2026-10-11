const possibleContainers = $('.job, .job-listing, .listing-item, .career-item, .position, .vacancy, .posting').filter(function(){ return $(this).find('h1, h2, h3, .title, .job-title, a').first().text().trim().length>0; });
possibleContainers.each(function(){ const container = $(this);
const title = container.find('h1, h2, h3, .title, .job-title, a').first().text().trim();
if(!title){return;}
const companyName = container.find('.company, .company-name, .employer').first().text().trim()||null;
const description = container.find('.description, .job-description, .desc').first().text().trim()||null;
const location = container.find('.location, .job-location, .city').first().text().trim()||null;
let jobType = null;
const typeText = container.find('.type, .job-type').first().text().toLowerCase();
if(typeText.includes('full')){jobType='full_time';}
else if(typeText.includes('part')){jobType='part_time';}
else if(typeText.includes('contract')){jobType='contract';}
else if(typeText.includes('intern')){jobType='internship';}
else if(typeText.includes('remote')){jobType='remote';}
const sourceUrl = container.find('a[href]').first().attr('href')||null;
let postedDateIsoString = null;
const postedText = container.find('.posted, .date-posted, time').first().attr('datetime')||container.find('.posted, .date-posted, time').first().text().trim();
if(postedText){ const d=new Date(postedText); if(!isNaN(d)) postedDateIsoString=d.toISOString(); }
let deadlineIsoString = null;
const deadlineText = container.find('.deadline, .apply-by, time[datetime]').first().attr('datetime')||container.find('.deadline, .apply-by').first().text().trim();
if(deadlineText){ const d=new Date(deadlineText); if(!isNaN(d)) deadlineIsoString=d.toISOString(); }
let salaryMin=null,salaryMax=null,salaryCurrency=null;
const salaryText = container.find('.salary, .pay, .compensation').first().text().replace(/[,]/g,'').trim();
if(salaryText){ const currencyMatch=salaryText.match(/^[^\d]*[A-Za-z]{3}|[£$€¥]/); if(currencyMatch){salaryCurrency=currencyMatch[0].trim();}
 const numbers=salaryText.match(/\\d+(?:\\.\\d+)?/g);
 if(numbers && numbers.length){ salaryMin=parseFloat(numbers[0]); if(numbers[1]) salaryMax=parseFloat(numbers[1]); else salaryMax=salaryMin; } }
result.push({title, companyName, description, location, jobType, sourceUrl, postedDateIsoString, deadlineIsoString, salaryMin, salaryMax, salaryCurrency}); });