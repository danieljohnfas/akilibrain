const jsonLdScripts = $('script[type="application/ld+json"]');
jsonLdScripts.each((i, el) => {
  try {
    const content = $(el).html();
    if (!content) return;
    const data = JSON.parse(content);
    const items = Array.isArray(data) ? data : (data['@graph'] || [data]);
    items.forEach(item => {
      const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
      if (types.includes('JobPosting')) {
        const job = {
          title: item.title || '',
          companyName: item.hiringOrganization?.name || '',
          description: item.description || '',
          location: '',
          jobType: item.employmentType || '',
          sourceUrl: item.url || '',
          postedDateIsoString: item.datePosted || '',
          deadlineIsoString: item.validThrough || '',
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: ''
        };
        if (item.jobLocation) {
          const loc = item.jobLocation;
          if (loc.address) {
            const addr = loc.address;
            const parts = [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.addressCountry?.name || addr.addressCountry].filter(Boolean);
            job.location = parts.join(', ');
          } else if (typeof loc === 'string') {
            job.location = loc;
          }
        }
        if (item.baseSalary && item.baseSalary.value) {
          const val = item.baseSalary.value;
          job.salaryMin = val.minValue != null ? Number(val.minValue) : null;
          job.salaryMax = val.maxValue != null ? Number(val.maxValue) : null;
          job.salaryCurrency = val.currency || '';
        }
        if (job.title) {
          result.push(job);
        }
      }
    });
  } catch (e) {
    // ignore parse errors
  }
});

// Fallback: if no jobs found via JSON-LD, try to extract from article content
if (result.length === 0) {
  // Look for typical job listing containers in the article
  $('.entry-content, .post-content, .content-area, main article').each((i, container) => {
    const $container = $(container);
    // Try to find headings that might be job titles
    $container.find('h2, h3, h4').each((j, heading) => {
      const $heading = $(heading);
      const title = $heading.text().trim();
      if (!title) return;
      // Heuristic: title contains keywords like "Officer", "Specialist", "Coordinator", "Manager", "Analyst", "Assistant", "Director"
      if (/officer|specialist|coordinator|manager|analyst|assistant|director|consultant|advisor|intern|volunteer/i.test(title)) {
        // Get surrounding content until next heading
        let description = '';
        let $next = $heading.next();
        while ($next.length && !$next.is('h2, h3, h4')) {
          description += $next.text() + ' ';
          $next = $next.next();
        }
        // Try to find a link
        let sourceUrl = '';
        const $link = $heading.find('a').first();
        if ($link.length) {
          sourceUrl = $link.attr('href') || '';
        } else {
          const $firstLink = $heading.nextUntil('h2, h3, h4').find('a').first();
          if ($firstLink.length) sourceUrl = $firstLink.attr('href') || '';
        }
        // Extract company from context (maybe UN agency)
        let companyName = '';
        const text = description.toLowerCase();
        if (text.includes('undp')) companyName = 'UNDP';
        else if (text.includes('unicef')) companyName = 'UNICEF';
        else if (text.includes('unhcr')) companyName = 'UNHCR';
        else if (text.includes('wfp')) companyName = 'WFP';
        else if (text.includes('un ')) companyName = 'United Nations';
        // Location heuristic
        let location = '';
        const locMatch = description.match(/(?:location|duty station|based in)\s*[:\-]\s*([^.\n]+)/i);
        if (locMatch) location = locMatch[1].trim();
        // Job type heuristic
        let jobType = '';
        if (/full.?time/i.test(description)) jobType = 'full_time';
        else if (/part.?time/i.test(description)) jobType = 'part_time';
        else if (/contract/i.test(description)) jobType = 'contract';
        else if (/intern/i.test(description)) jobType = 'internship';
        else if (/remote/i.test(description)) jobType = 'remote';
        // Date heuristics
        let postedDateIsoString = '';
        let deadlineIsoString = '';
        const datePatterns = [
          /(?:posted|published|date)\s*[:\-]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
          /(?:deadline|closing|apply by)\s*[:\-]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i
        ];
        // simple extraction, not full ISO conversion
        // We'll just store raw strings
        const postedMatch = description.match(/(?:posted|published|date)\s*[:\-]\s*([^.\n]+)/i);
        if (postedMatch) postedDateIsoString = postedMatch[1].trim();
        const deadlineMatch = description.match(/(?:deadline|closing|apply by)\s*[:\-]\s*([^.\n]+)/i);
        if (deadlineMatch) deadlineIsoString = deadlineMatch[1].trim();
        // Salary not typically in article
        result.push({
          title,
          companyName,
          description: description.trim(),
          location,
          jobType,
          sourceUrl,
          postedDateIsoString,
          deadlineIsoString,
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: ''
        });
      }
    });
  });
}

// Deduplicate by title+company+sourceUrl
const seen = new Set();
const unique = [];
result.forEach(job => {
  const key = job.title + '|' + job.companyName + '|' + job.sourceUrl;
  if (!seen.has(key)) {
    seen.add(key);
    unique.push(job);
  }
});
result.length = 0;
unique.forEach(job => result.push(job));