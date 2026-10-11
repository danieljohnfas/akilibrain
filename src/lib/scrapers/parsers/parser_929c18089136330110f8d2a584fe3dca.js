let scripts = $('script[type="application/ld+json"]');
scripts.each((i, el) => {
  let txt = $(el).contents().text().trim();
  if (!txt) return;
  try {
    let data = JSON.parse(txt);
    function findJobs(obj) {
      if (Array.isArray(obj)) {
        obj.forEach(findJobs);
      } else if (obj && typeof obj === 'object') {
        if (obj['@type'] === 'JobPosting') {
          processJob(obj);
        } else {
          Object.values(obj).forEach(findJobs);
        }
      }
    }
    function processJob(job) {
      let obj = {};
      if (job.title) obj.title = job.title;
      else if (job.name) obj.title = job.name;
      if (job.hiringOrganization && job.hiringOrganization.name) obj.companyName = job.hiringOrganization.name;
      if (job.description) obj.description = job.description;
      if (job.jobLocation && job.jobLocation.address) {
        let addr = job.jobLocation.address;
        let parts = [];
        if (addr.addressLocality) parts.push(addr.addressLocality);
        if (addr.addressRegion) parts.push(addr.addressRegion);
        if (addr.addressCountry) parts.push(addr.addressCountry);
        if (parts.length) obj.location = parts.join(', ');
      }
      if (job.employmentType) {
        let type = job.employmentType.toString().toLowerCase();
        if (type.includes('full')) obj.jobType = 'full_time';
        else if (type.includes('part')) obj.jobType = 'part_time';
        else if (type.includes('contract')) obj.jobType = 'contract';
        else if (type.includes('intern')) obj.jobType = 'internship';
        else if (type.includes('remote')) obj.jobType = 'remote';
      }
      if (job.url) obj.sourceUrl = job.url;
      if (job.datePosted) obj.postedDateIsoString = new Date(job.datePosted).toISOString();
      if (job.validThrough) obj.deadlineIsoString = new Date(job.validThrough).toISOString();
      if (job.baseSalary && typeof job.baseSalary === 'object') {
        let val = job.baseSalary.value;
        if (val) {
          if (val.minValue != null) obj.salaryMin = Number(val.minValue);
          if (val.maxValue != null) obj.salaryMax = Number(val.maxValue);
          if (val.currency) obj.salaryCurrency = val.currency;
        }
      }
      result.push(obj);
    }
    findJobs(data);
  } catch (e) {}
});