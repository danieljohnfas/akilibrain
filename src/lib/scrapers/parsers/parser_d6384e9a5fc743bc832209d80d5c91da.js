// Extract job postings from JSON‑LD scripts
$('script[type="application/ld+json"]').each((_, el) => {
  let txt = $(el).contents().text().trim();
  if (!txt) return;
  // Some pages embed multiple JSON objects; try to parse each line that looks like JSON
  const candidates = [];
  // Split by closing brace followed by optional whitespace and opening brace
  txt.split(/}\s*{+/).forEach((part, i, arr) => {
    let jsonStr = part;
    if (i > 0) jsonStr = '{' + jsonStr;
    if (i < arr.length - 1) jsonStr = jsonStr + '}';
    candidates.push(jsonStr);
  });
  candidates.forEach(str => {
    let data;
    try {
      data = JSON.parse(str);
    } catch (e) {
      return;
    }
    const objects = Array.isArray(data['@graph']) ? data['@graph'] : [data];
    objects.forEach(obj => {
      const type = obj['@type'];
      const isJob = Array.isArray(type) ? type.includes('JobPosting') : type === 'JobPosting';
      if (!isJob) return;

      const job = {};

      // Title
      if (obj.title) job.title = String(obj.title).trim();
      else if (obj.name) job.title = String(obj.name).trim();

      // Company
      if (obj.hiringOrganization && obj.hiringOrganization.name) {
        job.companyName = String(obj.hiringOrganization.name).trim();
      } else if (obj.employer && obj.employer.name) {
        job.companyName = String(obj.employer.name).trim();
      }

      // Description (keep raw HTML/text)
      if (obj.description) job.description = String(obj.description).trim();

      // Location
      const loc = obj.jobLocation || obj.location;
      if (loc) {
        const address = Array.isArray(loc) ? loc[0].address : loc.address;
        if (address) {
          const parts = [];
          if (address.streetAddress) parts.push(address.streetAddress);
          if (address.addressLocality) parts.push(address.addressLocality);
          if (address.addressRegion) parts.push(address.addressRegion);
          if (address.postalCode) parts.push(address.postalCode);
          if (address.addressCountry) parts.push(address.addressCountry);
          if (parts.length) job.location = parts.join(', ');
        }
      }

      // Employment type
      if (obj.employmentType) {
        const emp = Array.isArray(obj.employmentType) ? obj.employmentType[0] : obj.employmentType;
        const map = {
          FULL_TIME: 'full_time',
          PART_TIME: 'part_time',
          CONTRACT: 'contract',
          INTERNSHIP: 'internship',
          TEMPORARY: 'contract',
          REMOTE: 'remote'
        };
        const key = emp.toString().toUpperCase();
        if (map[key]) job.jobType = map[key];
      }

      // Source URL
      if (obj.url) job.sourceUrl = String(obj.url).trim();

      // Dates
      if (obj.datePosted) job.postedDateIsoString = String(obj.datePosted).trim();
      if (obj.validThrough) job.deadlineIsoString = String(obj.validThrough).trim();

      // Salary
      const salary = obj.baseSalary;
      if (salary) {
        let val = salary.value || salary;
        if (val && typeof val === 'object') {
          if (val.minValue) job.salaryMin = parseFloat(val.minValue);
          if (val.maxValue) job.salaryMax = parseFloat(val.maxValue);
          if (!job.salaryMin && !job.salaryMax && val.value) {
            const num = parseFloat(val.value);
            if (!isNaN(num)) {
              job.salaryMin = job.salaryMax = num;
            }
          }
          if (val.currency) job.salaryCurrency = String(val.currency).trim();
        } else if (typeof val === 'string' || typeof val === 'number') {
          const num = parseFloat(val);
          if (!isNaN(num)) {
            job.salaryMin = job.salaryMax = num;
          }
        }
        if (salary.currency && !job.salaryCurrency) {
          job.salaryCurrency = String(salary.currency).trim();
        }
      }

      result.push(job);
    });
  });
});