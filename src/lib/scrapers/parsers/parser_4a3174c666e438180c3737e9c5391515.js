// Find and parse all JSON‑LD blocks
$('script[type="application/ld+json"]').each((_, el) => {
  const txt = $(el).contents().first().text().trim();
  if (!txt) return;
  let data;
  try {
    data = JSON.parse(txt);
  } catch {
    return;
  }
  processLD(data);
});

function processLD(node) {
  if (!node) return;
  if (Array.isArray(node)) {
    node.forEach(processLD);
    return;
  }
  if (typeof node !== 'object') return;

  const type = node['@type'];

  if (type === 'JobPosting') {
    pushJob(node);
    return;
  }

  // ItemList may contain job postings in itemListElement
  if (type === 'ItemList' && Array.isArray(node.itemListElement)) {
    node.itemListElement.forEach(item => {
      // Some lists wrap JobPosting inside a ListItem
      if (item['@type'] === 'ListItem' && item.item) {
        processLD(item.item);
      } else {
        processLD(item);
      }
    });
    return;
  }

  // WebPage may reference mainEntity
  if (type === 'WebPage' && node.mainEntity) {
    processLD(node.mainEntity);
    return;
  }

  // Generic ListItem wrapper
  if (type === 'ListItem' && node.item) {
    processLD(node.item);
    return;
  }

  // Recurse into any nested objects that might hold JobPosting
  Object.values(node).forEach(value => {
    if (typeof value === 'object') processLD(value);
  });
}

function pushJob(j) {
  const title = (j.title || j.name || '').trim();
  if (!title) return; // ensure a clear job title

  const job = {
    title,
    companyName: (j.hiringOrganization && j.hiringOrganization.name || '').trim(),
    description: (j.description || '').trim(),
    location: extractLocation(j),
    jobType: mapJobType(j.employmentType),
    sourceUrl: (j.url || '').trim(),
    postedDateIsoString: (j.datePosted || '').trim(),
    deadlineIsoString: (j.validThrough || '').trim(),
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null
  };

  // Salary extraction (schema.org supports several formats)
  if (j.baseSalary) {
    const s = j.baseSalary;
    // Numeric value or value range object
    if (typeof s.value === 'object') {
      job.salaryMin = s.value.minValue != null ? Number(s.value.minValue) : null;
      job.salaryMax = s.value.maxValue != null ? Number(s.value.maxValue) : null;
      job.salaryCurrency = s.currency || '';
    } else if (typeof s.value === 'number' || typeof s.value === 'string') {
      const val = Number(s.value);
      if (!isNaN(val)) {
        job.salaryMin = val;
        job.salaryMax = val;
        job.salaryCurrency = s.currency || '';
      }
    }
  }

  result.push(job);
}

function extractLocation(j) {
  if (!j.jobLocation) return '';
  const addr = j.jobLocation.address || {};
  const parts = [
    addr.streetAddress,
    addr.addressLocality,
    addr.addressRegion,
    addr.addressCountry
  ].filter(Boolean);
  return parts.join(', ');
}

function mapJobType(type) {
  if (!type) return '';
  const lowered = type.toString().toLowerCase();
  if (lowered.includes('full')) return 'full_time';
  if (lowered.includes('part')) return 'part_time';
  if (lowered.includes('contract')) return 'contract';
  if (lowered.includes('intern')) return 'internship';
  if (lowered.includes('remote')) return 'remote';
  return '';
}