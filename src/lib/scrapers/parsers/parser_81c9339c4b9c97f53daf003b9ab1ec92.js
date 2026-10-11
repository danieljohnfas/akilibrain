let pageTitle = $('title').first().text().trim();
let title = '';
let companyName = '';
if (pageTitle) {
  let parts = pageTitle.split(' - ');
  if (parts.length >= 2) {
    title = parts[0].trim();
    companyName = parts[1].trim();
  } else {
    title = pageTitle;
  }
}
let description = $('meta[name="description"]').attr('content') || $('.job-description, .description, #job-description').text().trim() || '';
let location = $('.job-location, .location, span.location').first().text().trim();
let jobTypeText = $('.job-type, .type, span.type').first().text().trim().toLowerCase();
let jobTypeMap = {'full time':'full_time','full-time':'full_time','part time':'part_time','part-time':'part_time','contract':'contract','internship':'internship','remote':'remote'};
let jobType = jobTypeMap[jobTypeText] || (jobTypeText.includes('full') ? 'full_time' : undefined);
let sourceUrl = $('link[rel="canonical"]').attr('href') || '';
let postedDateAttr = $('time[datetime]').first().attr('datetime') || '';
let postedDateIsoString = postedDateAttr ? new Date(postedDateAttr).toISOString() : '';
let deadlineAttr = $('time.deadline[datetime]').attr('datetime') || '';
let deadlineIsoString = deadlineAttr ? new Date(deadlineAttr).toISOString() : '';
let salaryText = $('.salary, .job-salary').first().text();
let salaryMin, salaryMax, salaryCurrency;
if (salaryText) {
  let match = salaryText.match(/([A-Z]{3})?\s?([\d,]+)(?:\s?[-–]\s?([A-Z]{3})?\s?([\d,]+))?/);
  if (match) {
    salaryCurrency = match[1] || match[3] || '';
    salaryMin = Number(match[2].replace(/,/g,''));
    if (match[4]) salaryMax = Number(match[4].replace(/,/g,''));
  }
}
if (title) {
  result.push({
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
  });
}