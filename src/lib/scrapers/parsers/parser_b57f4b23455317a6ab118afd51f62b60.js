var title = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim();
if (title) {
  var job = { title: title };
  var company = $('meta[property="og:site_name"]').attr('content') || $('meta[name="author"]').attr('content');
  if (company) job.companyName = company.trim();
  var description = $('meta[name="description"]').attr('content') || $('.field--name-body, .node--type-job .field--name-body, article, .content, .node__content').first().text().trim();
  if (description) job.description = description;
  var sourceUrl = $('meta[property="og:url"]').attr('content');
  if (sourceUrl) job.sourceUrl = sourceUrl;
  var pageText = $.root().text();
  var locMatch = pageText.match(/Location[:\s]*([A-Za-z0-9 ,.\-]+)/i);
  if (locMatch) job.location = locMatch[1].trim();
  var typeMatch = pageText.match(/(Full[-\s]?Time|Part[-\s]?Time|Contract|Internship|Remote)/i);
  if (typeMatch) {
    var map = {fulltime:'full_time',full:'full_time',parttime:'part_time',part:'part_time',contract:'contract',internship:'internship',remote:'remote'};
    var key = typeMatch[0].replace(/[-\s]/g,'').toLowerCase();
    job.jobType = map[key] || typeMatch[0].toLowerCase();
  }
  var postedMatch = pageText.match(/Posted[:\s]*([A-Za-z0-9, \-]+)\b/i);
  if (postedMatch) {
    var d = new Date(postedMatch[1]);
    if (!isNaN(d)) job.postedDateIsoString = d.toISOString();
  }
  var deadlineMatch = pageText.match(/Deadline[:\s]*([A-Za-z0-9, \-]+)\b/i);
  if (deadlineMatch) {
    var d2 = new Date(deadlineMatch[1]);
    if (!isNaN(d2)) job.deadlineIsoString = d2.toISOString();
  }
  var salaryMatch = pageText.match(/([\$£€])\s?([\d,]+)(?:\s?[-–]\s?[\$£€]?\s?([\d,]+))?/);
  if (salaryMatch) {
    job.salaryCurrency = salaryMatch[1];
    job.salaryMin = parseInt(salaryMatch[2].replace(/,/g,''),10);
    if (salaryMatch[3]) job.salaryMax = parseInt(salaryMatch[3].replace(/,/g,''),10);
  }
  result.push(job);
}