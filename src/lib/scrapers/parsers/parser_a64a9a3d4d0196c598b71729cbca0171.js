// Attempt to extract JobPosting data from JSON‑LD
$('script[type="application/ld+json"]').each((_, el) => {
  let raw = $(el).contents().first().text().trim();
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    const candidates = Array.isArray(data) ? data : (data['@graph'] ? data['@graph'] : [data]);
    candidates.forEach(item => {
      if (item && (item['@type'] === 'JobPosting' || (Array.isArray(item['@type']) && item['@type'].includes('JobPosting')))) {
        const job = {};

        // Title
        job.title = item.title || item.name || '';

        // Company
        if (item.hiringOrganization && item.hiringOrganization.name) {
          job.companyName = item.hiringOrganization.name;
        } else if (item.employer && item.employer.name) {
          job.companyName = item.employer.name;
        } else {
          job.companyName = '';
        }

        // Description
        job.description = item.description || '';

        // Location
        if (item.jobLocation && item.jobLocation.address) {
          const addr = item.jobLocation.address;
          const parts = [
            addr.streetAddress,
            addr.addressLocality,
            addr.addressRegion,
            addr.postalCode,
            addr.addressCountry
          ].filter(Boolean);
          job.location = parts.join(', ');
        } else {
          job.location = '';
        }

        // Job Type mapping
        if (item.employmentType) {
          const typeStr = Array.isArray(item.employmentType) ? item.employmentType[0] : item.employmentType;
          const normalized = typeStr.toLowerCase().replace(/_/g, '').replace(/\s+/g, '');
          if (/(full.?time)/.test(normalized)) job.jobType = 'full_time';
          else if (/(part.?time)/.test(normalized)) job.jobType = 'part_time';
          else if (/(contract)/.test(normalized)) job.jobType = 'contract';
          else if (/(internship)/.test(normalized)) job.jobType = 'internship';
          else if (/(remote)/.test(normalized)) job.jobType = 'remote';
          else job.jobType = '';
        } else {
          job.jobType = '';
        }

        // Source URL
        job.sourceUrl = item.url || $('meta[property="og:url"]').attr('content') || '';

        // Dates
        job.postedDateIsoString = item.datePosted || $('meta[property="article:published_time"]').attr('content') || '';
        job.deadlineIsoString = item.validThrough || '';

        // Salary
        if (item.baseSalary && typeof item.baseSalary === 'object') {
          const salary = item.baseSalary;
          if (salary.value) {
            if (typeof salary.value === 'object') {
              job.salaryMin = salary.value.minValue ? Number(salary.value.minValue) : null;
              job.salaryMax = salary.value.maxValue ? Number(salary.value.maxValue) : null;
              job.salaryCurrency = salary.value.currency || salary.currency || '';
            } else {
              const val = Number(salary.value);
              job.salaryMin = isNaN(val) ? null : val;
              job.salaryMax = null;
              job.salaryCurrency = salary.currency || '';
            }
          }
        }

        result.push(job);
      }
    });
  } catch (e) {
    // ignore malformed JSON
  }
});

// Fallback extraction when no JSON‑LD JobPosting was found
if (result.length === 0) {
  const title = $('h1').first().text().trim() ||
                $('meta[property="og:title"]').attr('content')?.trim() || '';
  // Consider it a job only if a plausible title exists and the page mentions "job" or "position"
  const isJob = /job|position|role|opening/i.test(title);
  if (title && isJob) {
    const job = { title };

    // Company name – try meta author or look for a strong tag containing company name
    const metaAuthor = $('meta[name="author"]').attr('content')?.trim();
    if (metaAuthor) {
      job.companyName = metaAuthor;
    } else {
      const possibleCompany = $('strong').filter((_, el) => /company|employer/i.test($(el).text())).first().text().trim();
      job.companyName = possibleCompany || '';
    }

    // Description – main article text
    const articleText = $('article').text().trim() ||
                        $('.post-content').text().trim() ||
                        $('.entry-content').text().trim() ||
                        '';
    job.description = articleText;

    // Location – look for elements containing "Location"
    const locElem = $('p, span, div').filter((_, el) => /location/i.test($(el).text())).first();
    job.location = locElem.text().replace(/location[:\s]*/i, '').trim() || '';

    // Job type – search for common keywords
    const typeText = $('p, span, div').filter((_, el) => /type/i.test($(el).text())).first().text().toLowerCase();
    if (/(full.?time)/.test(typeText)) job.jobType = 'full_time';
    else if (/(part.?time)/.test(typeText)) job.jobType = 'part_time';
    else if (/(contract)/.test(typeText)) job.jobType = 'contract';
    else if (/(internship)/.test(typeText)) job.jobType = 'internship';
    else if (/(remote)/.test(typeText)) job.jobType = 'remote';
    else job.jobType = '';

    // Source URL
    job.sourceUrl = $('link[rel="canonical"]').attr('href') ||
                    $('meta[property="og:url"]').attr('content') ||
                    '';

    // Dates
    job.postedDateIsoString = $('meta[property="article:published_time"]').attr('content') || '';
    job.deadlineIsoString = '';

    // Salary – attempt simple regex extraction
    const salaryText = $('p, span, div').filter((_, el) => /salary/i.test($(el).text())).first().text();
    const salaryMatch = salaryText.match(/([\d,]+)\s?-\s?([\d,]+)\s?([A-Z]{3})|([\d,]+)\s?([A-Z]{3})/i);
    if (salaryMatch) {
      if (salaryMatch[1] && salaryMatch[2] && salaryMatch[3]) {
        job.salaryMin = Number(salaryMatch[1].replace(/,/g, ''));
        job.salaryMax = Number(salaryMatch[2].replace(/,/g, ''));
        job.salaryCurrency = salaryMatch[3];
      } else if (salaryMatch[4] && salaryMatch[5]) {
        job.salaryMin = Number(salaryMatch[4].replace(/,/g, ''));
        job.salaryMax = null;
        job.salaryCurrency = salaryMatch[5];
      }
    }

    result.push(job);
  }
}