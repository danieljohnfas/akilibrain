const jsonScripts = $('script[type="application/ld+json"]');
jsonScripts.each((i, el) => {
  try {
    const raw = $(el).contents().text();
    if (!raw) return;
    const data = JSON.parse(raw);
    const items = Array.isArray(data) ? data : [data];
    items.forEach(item => {
      if (item && item['@type'] === 'JobPosting') {
        const job = {
          title: item.title || '',
          companyName: item.hiringOrganization?.name || '',
          description: item.description || '',
          location: item.jobLocation?.address?.addressLocality || '',
          jobType: (() => {
            const type = (item.employmentType || '').toLowerCase();
            if (type.includes('full')) return 'full_time';
            if (type.includes('part')) return 'part_time';
            if (type.includes('contract')) return 'contract';
            if (type.includes('intern')) return 'internship';
            if (type.includes('remote')) return 'remote';
            return '';
          })(),
          sourceUrl: item.url || '',
          postedDateIsoString: item.datePosted || '',
          deadlineIsoString: item.validThrough || '',
          salaryMin: typeof item.baseSalary?.value === 'number' ? item.baseSalary.value : null,
          salaryMax: null,
          salaryCurrency: item.baseSalary?.currency || ''
        };
        result.push(job);
      }
    });
  } catch (e) {
    // ignore parsing errors
  }
});