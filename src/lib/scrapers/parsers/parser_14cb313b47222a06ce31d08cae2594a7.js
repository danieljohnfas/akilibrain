// Gather all script tags containing JSON‑LD
$('script[type="application/ld+json"]').each((_, el) => {
  let data;
  try {
    data = JSON.parse($(el).contents().text());
  } catch (e) {
    return;
  }

  // The JSON‑LD may be an object or an array / graph
  const items = Array.isArray(data) ? data : (data['@graph'] ? data['@graph'] : [data]);

  items.forEach(item => {
    // If the item itself is a JobPosting or contains one in an array
    const postings = [];

    if (item['@type'] && (Array.isArray(item['@type']) ? item['@type'].includes('JobPosting') : item['@type'] === 'JobPosting')) {
      postings.push(item);
    } else if (Array.isArray(item)) {
      item.forEach(sub => {
        if (sub['@type'] && (Array.isArray(sub['@type']) ? sub['@type'].includes('JobPosting') : sub['@type'] === 'JobPosting')) {
          postings.push(sub);
        }
      });
    }

    postings.forEach(job => {
      const title = job.title || job.name || '';
      if (!title) return; // ensure a clear job title exists

      const hiringOrg = job.hiringOrganization || {};
      const locationObj = job.jobLocation && job.jobLocation.address ? job.jobLocation.address : {};

      const salaryInfo = job.baseSalary || {};
      let salaryMin, salaryMax, salaryCurrency;
      if (salaryInfo.value && typeof salaryInfo.value === 'object') {
        salaryMin = salaryInfo.value.minValue != null ? Number(salaryInfo.value.minValue) : undefined;
        salaryMax = salaryInfo.value.maxValue != null ? Number(salaryInfo.value.maxValue) : undefined;
        salaryCurrency = salaryInfo.value.currency || undefined;
      } else if (typeof salaryInfo === 'object') {
        salaryMin = salaryInfo.minValue != null ? Number(salaryInfo.minValue) : undefined;
        salaryMax = salaryInfo.maxValue != null ? Number(salaryInfo.maxValue) : undefined;
        salaryCurrency = salaryInfo.currency || undefined;
      }

      // Normalize employment type to required enum
      let jobTypeRaw = job.employmentType || '';
      if (Array.isArray(jobTypeRaw)) jobTypeRaw = jobTypeRaw[0];
      const normalized = (jobTypeRaw || '').toString().trim().toLowerCase().replace(/\s+/g, '_');
      const allowed = ['full_time','part_time','contract','internship','remote'];
      const jobType = allowed.includes(normalized) ? normalized : undefined;

      result.push({
        title: title.trim(),
        companyName: (hiringOrg.name || '').trim() || undefined,
        description: (job.description || '').trim() || undefined,
        location: (
          (locationObj.addressLocality ? locationObj.addressLocality + ', ' : '') +
          (locationObj.addressRegion ? locationObj.addressRegion + ', ' : '') +
          (locationObj.addressCountry ? locationObj.addressCountry : '')
        ).replace(/,\s*$/,'').trim() || undefined,
        jobType,
        sourceUrl: (job.url || job.sameAs || '').trim() || undefined,
        postedDateIsoString: (job.datePosted || '').trim() || undefined,
        deadlineIsoString: (job.validThrough || '').trim() || undefined,
        salaryMin: salaryMin !== undefined ? salaryMin : undefined,
        salaryMax: salaryMax !== undefined ? salaryMax : undefined,
        salaryCurrency: salaryCurrency || undefined
      });
    });
  });
});