result = result || [];

let title = $('h1').first().text().trim();
if (!title) {
  title = $('meta[property="og:title"]').attr('content') || '';
}
if (title && /job/i.test(title)) {
  let job = { title: title };
  let compMatch = title.match(/at\s+([^,]+)[,]/i);
  if (compMatch) job.companyName = compMatch[1].trim();
  let locMatch = title.match(/,\s*([^–-]+)[–-]/);
  if (locMatch) job.location = locMatch[1].trim();
  let desc = $('.entry-content').text().trim() || $('.post-content').text().trim();
  if (desc) job.description = desc;
  let url = $('meta[property="og:url"]').attr('content');
  if (url) job.sourceUrl = url;
  let posted = $('meta[property="article:published_time"]').attr('content');
  if (posted) job.postedDateIsoString = posted;
  let deadline = $('meta[property="article:expiration_time"]').attr('content');
  if (deadline) job.deadlineIsoString = deadline;
  $('script[type="application/ld+json"]').each(function () {
    try {
      let data = JSON.parse($(this).contents().first().text());
      let items = [];
      if (Array.isArray(data)) items = data;
      else if (data['@graph']) items = data['@graph'];
      else items = [data];
      items.forEach(item => {
        if (item['@type'] && (item['@type'] === 'JobPosting' || (Array.isArray(item['@type']) && item['@type'].includes('JobPosting')))) {
          if (!job.title && item.title) job.title = item.title;
          if (!job.companyName && item.hiringOrganization && item.hiringOrganization.name) job.companyName = item.hiringOrganization.name;
          if (!job.location && item.jobLocation && item.jobLocation.address && item.jobLocation.address.addressLocality) job.location = item.jobLocation.address.addressLocality;
          if (!job.description && item.description) job.description = item.description;
          if (!job.sourceUrl && item.url) job.sourceUrl = item.url;
          if (!job.postedDateIsoString && item.datePosted) job.postedDateIsoString = item.datePosted;
          if (!job.deadlineIsoString && item.validThrough) job.deadlineIsoString = item.validThrough;
          if (!job.salaryMin && item.baseSalary && typeof item.baseSalary.value === 'object') {
            let val = item.baseSalary.value;
            if (val.minValue) job.salaryMin = Number(val.minValue);
            if (val.maxValue) job.salaryMax = Number(val.maxValue);
            if (val.currency) job.salaryCurrency = val.currency;
          }
          if (!job.jobType && item.employmentType) {
            let jt = item.employmentType.toString().toLowerCase();
            if (jt.includes('full')) job.jobType = 'full_time';
            else if (jt.includes('part')) job.jobType = 'part_time';
            else if (jt.includes('contract')) job.jobType = 'contract';
            else if (jt.includes('intern')) job.jobType = 'internship';
            else if (jt.includes('remote')) job.jobType = 'remote';
          }
        }
      });
    } catch (e) {}
  });
  result.push(job);
}