const jsonLdScripts = $('script[type="application/ld+json"]');
jsonLdScripts.each((i, el) => {
  try {
    const data = JSON.parse($(el).html());
    const graph = data['@graph'] || [data];
    graph.forEach(item => {
      const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
      if (types.includes('JobPosting')) {
        const job = {};
        job.title = item.title || '';
        job.companyName = item.hiringOrganization ? (item.hiringOrganization.name || '') : '';
        job.description = item.description || '';
        if (item.jobLocation && item.jobLocation.address) {
          const addr = item.jobLocation.address;
          job.location = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean).join(', ');
        } else {
          job.location = '';
        }
        job.jobType = item.employmentType || '';
        job.sourceUrl = item.url || '';
        job.postedDateIsoString = item.datePosted || '';
        job.deadlineIsoString = item.validThrough || '';
        if (item.baseSalary && item.baseSalary.value) {
          job.salaryMin = item.baseSalary.value.minValue ? Number(item.baseSalary.value.minValue) : null;
          job.salaryMax = item.baseSalary.value.maxValue ? Number(item.baseSalary.value.maxValue) : null;
          job.salaryCurrency = item.baseSalary.currency || '';
        }
        result.push(job);
      }
    });
  } catch (e) {}
});