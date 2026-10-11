var jobData = [];

$('script[type="application/ld+json"]').each(function () {
  try {
    var json = JSON.parse($(this).contents().first().text());
    if (Array.isArray(json)) {
      json.forEach(processItem);
    } else {
      processItem(json);
    }
  } catch (e) {}
});

function processItem(item) {
  var types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
  if (!types.includes('JobPosting')) return;

  var job = {};

  if (item.title) job.title = String(item.title).trim();

  if (item.hiringOrganization && item.hiringOrganization.name) {
    job.companyName = String(item.hiringOrganization.name).trim();
  }

  if (item.description) job.description = String(item.description).trim();

  if (item.jobLocation && item.jobLocation.address) {
    var addr = item.jobLocation.address;
    if (addr.addressLocality) job.location = String(addr.addressLocality).trim();
    else if (addr.streetAddress) job.location = String(addr.streetAddress).trim();
  }

  if (item.employmentType) {
    var et = String(item.employmentType).toLowerCase();
    if (et.includes('full')) job.jobType = 'full_time';
    else if (et.includes('part')) job.jobType = 'part_time';
    else if (et.includes('contract')) job.jobType = 'contract';
    else if (et.includes('intern')) job.jobType = 'internship';
    else if (et.includes('remote')) job.jobType = 'remote';
  }

  if (item.identifier && item.identifier.value) {
    job.sourceUrl = String(item.identifier.value).trim();
  }

  if (item.datePosted) {
    var d = new Date(item.datePosted);
    if (!isNaN(d)) job.postedDateIsoString = d.toISOString();
  }

  if (item.validThrough) {
    var d = new Date(item.validThrough);
    if (!isNaN(d)) job.deadlineIsoString = d.toISOString();
  }

  if (item.baseSalary) {
    var sal = item.baseSalary;
    if (sal.value) job.salaryMin = Number(sal.value) || undefined;
    if (sal.maxValue) job.salaryMax = Number(sal.maxValue) || undefined;
    if (sal.currency) job.salaryCurrency = String(sal.currency).trim();
  }

  result.push(job);
}