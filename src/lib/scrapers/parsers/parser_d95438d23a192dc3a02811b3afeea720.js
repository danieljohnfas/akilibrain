let jobFound = false;
function processItem(item) {
  if (!item || !item['@type']) return;
  if (item['@type'] === 'JobPosting') {
    jobFound = true;
    const obj = {};
    obj.title = item.title || item.name || '';
    obj.companyName = item.hiringOrganization?.name || '';
    obj.description = item.description || '';
    obj.location = '';
    if (item.jobLocation) {
      let loc = item.jobLocation;
      if (Array.isArray(loc)) loc = loc[0];
      obj.location = loc.address?.addressLocality || loc.address?.addressRegion || loc.address?.streetAddress || '';
    }
    obj.jobType = '';
    if (item.employmentType) {
      const type = item.employmentType.toString().toLowerCase();
      if (type.includes('full')) obj.jobType = 'full_time';
      else if (type.includes('part')) obj.jobType = 'part_time';
      else if (type.includes('contract')) obj.jobType = 'contract';
      else if (type.includes('intern')) obj.jobType = 'internship';
      else if (type.includes('remote')) obj.jobType = 'remote';
    }
    obj.sourceUrl = item.url || '';
    obj.postedDateIsoString = item.datePosted || '';
    obj.deadlineIsoString = item.validThrough || '';
    obj.salaryMin = null;
    obj.salaryMax = null;
    obj.salaryCurrency = null;
    if (item.baseSalary) {
      const sal = item.baseSalary;
      if (sal.value) {
        const v = sal.value;
        if (v.minValue != null) obj.salaryMin = Number(v.minValue);
        if (v.maxValue != null) obj.salaryMax = Number(v.maxValue);
        obj.salaryCurrency = v.currency || '';
      } else {
        if (sal.minValue != null) obj.salaryMin = Number(sal.minValue);
        if (sal.maxValue != null) obj.salaryMax = Number(sal.maxValue);
        obj.salaryCurrency = sal.currency || '';
      }
    }
    result.push(obj);
  } else if (item['@type'] === 'ItemList' && item.itemListElement) {
    item.itemListElement.forEach(el => processItem(el));
  }
}
$('script[type="application/ld+json"]').each(function () {
  const txt = $(this).html();
  try {
    const data = JSON.parse(txt.trim());
    if (Array.isArray(data)) {
      data.forEach(d => processItem(d));
    } else {
      processItem(data);
    }
  } catch (e) {}
});
if (!jobFound) {
  // result stays empty
}