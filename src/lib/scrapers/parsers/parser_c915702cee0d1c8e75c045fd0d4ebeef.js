// Gather all JSON‑LD blocks
const jsonBlocks = [];
$('script[type="application/ld+json"]').each((i, el) => {
  try {
    const parsed = JSON.parse($(el).html());
    jsonBlocks.push(parsed);
  } catch (_) {}
});

// Helper to recursively collect objects
function collectObjects(obj, arr = []) {
  if (Array.isArray(obj)) {
    obj.forEach(item => collectObjects(item, arr));
  } else if (obj && typeof obj === 'object') {
    arr.push(obj);
    Object.values(obj).forEach(val => collectObjects(val, arr));
  }
  return arr;
}

// Flatten all objects from JSON‑LD
const allObjects = [];
jsonBlocks.forEach(block => collectObjects(block, allObjects));

// Find JobPosting entries
const jobPostings = allObjects.filter(o => {
  const type = o['@type'];
  return (Array.isArray(type) ? type : [type]).includes('JobPosting');
});

jobPostings.forEach(job => {
  const obj = {};

  if (job.title) obj.title = String(job.title).trim();
  if (job.hiringOrganization && job.hiringOrganization.name) obj.companyName = String(job.hiringOrganization.name).trim();
  if (job.description) obj.description = String(job.description).trim();
  if (job.jobLocation && job.jobLocation.address && job.jobLocation.address.addressLocality) {
    obj.location = String(job.jobLocation.address.addressLocality).trim();
  }
  if (job.employmentType) {
    const map = {
      'FULL_TIME': 'full_time',
      'PART_TIME': 'part_time',
      'CONTRACT': 'contract',
      'INTERNSHIP': 'internship',
      'TEMPORARY': 'contract',
      'REMOTE': 'remote'
    };
    const typeKey = Array.isArray(job.employmentType) ? job.employmentType[0] : job.employmentType;
    obj.jobType = map[typeKey] || String(typeKey).toLowerCase();
  }
  if (job.url) obj.sourceUrl = String(job.url).trim();
  if (job.datePosted) obj.postedDateIsoString = new Date(job.datePosted).toISOString();
  if (job.validThrough) obj.deadlineIsoString = new Date(job.validThrough).toISOString();

  if (job.baseSalary) {
    const salary = job.baseSalary;
    if (salary.value) {
      const val = salary.value;
      if (val.minValue != null) obj.salaryMin = Number(val.minValue);
      if (val.maxValue != null) obj.salaryMax = Number(val.maxValue);
      if (val.currency) obj.salaryCurrency = String(val.currency);
    }
  }

  // Only push if a clear title exists
  if (obj.title) result.push(obj);
});