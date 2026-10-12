let title = ($('meta[property="og:title"]').attr('content') || $('title').text()).trim();
let companyName = ($('meta[property="og:site_name"]').attr('content') || '').trim();
let sourceUrl = ($('link[rel="canonical"]').attr('href') || '').trim();
let postedDateIsoString = ($('meta[property="article:published_time"]').attr('content') || '').trim();
let ogDesc = ($('meta[property="og:description"]').attr('content') || '').trim();
let description = ogDesc;

let locationMatch = ogDesc.match(/Location:\s*([^\n|]+)/i);
let location = locationMatch ? locationMatch[1].trim() : '';

let typeMatch = ogDesc.match(/Position\s*Type:\s*([^\n|]+)/i);
let rawJobType = typeMatch ? typeMatch[1].trim().toLowerCase() : '';
let jobTypeMap = {
  'full-time': 'full_time',
  'full time': 'full_time',
  'part-time': 'part_time',
  'part time': 'part_time',
  'contract': 'contract',
  'internship': 'internship',
  'remote': 'remote'
};
let jobType = jobTypeMap[rawJobType] || '';

let deadlineMatch = ogDesc.match(/Application\s*Deadline:\s*([^\n|]+)/i);
let deadlineRaw = deadlineMatch ? deadlineMatch[1].trim() : '';
let deadlineClean = deadlineRaw.replace(/\b(\d+)(st|nd|rd|th)\b/gi, '$1');
let deadlineDate = new Date(deadlineClean);
let deadlineIsoString = isNaN(deadlineDate.getTime()) ? '' : deadlineDate.toISOString();

let job = {
  title,
  companyName,
  description,
  location,
  jobType,
  sourceUrl,
  postedDateIsoString,
  deadlineIsoString
};

result.push(job);