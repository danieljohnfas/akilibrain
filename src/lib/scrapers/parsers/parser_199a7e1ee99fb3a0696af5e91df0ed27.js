// Locate JSON‑LD script blocks
$('script[type="application/ld+json"]').each((_, script) => {
  let data;
  try {
    data = JSON.parse($(script).contents().first().text());
  } catch (e) {
    return;
  }

  // Helper to process a possible graph structure
  const processGraph = (graph) => {
    if (!Array.isArray(graph)) return;
    graph.forEach((node) => {
      if (node && node['@type'] === 'SearchResultsPage' && node.mainEntity && node.mainEntity.itemListElement) {
        const items = node.mainEntity.itemListElement;
        items.forEach((listItem) => {
          const item = listItem && listItem.item;
          if (item && typeof item.name === 'string' && typeof item.url === 'string') {
            // Derive title and company name from the typical “Title job at Company” pattern
            let title = item.name.trim();
            let companyName = '';
            const splitIdx = title.toLowerCase().lastIndexOf(' job at ');
            if (splitIdx !== -1) {
              companyName = title.substring(splitIdx + 9).trim();
              title = title.substring(0, splitIdx).trim();
            }

            // Build the job object with available fields
            const job = {
              title,
              companyName,
              sourceUrl: item.url.trim()
            };

            // Optional fields – leave undefined if not present
            if (item.description) job.description = item.description.trim();
            if (item.location) job.location = item.location.trim();
            if (item.employmentType) {
              const type = item.employmentType.toString().toLowerCase();
              if (type.includes('full')) job.jobType = 'full_time';
              else if (type.includes('part')) job.jobType = 'part_time';
              else if (type.includes('contract')) job.jobType = 'contract';
              else if (type.includes('intern')) job.jobType = 'internship';
              else if (type.includes('remote')) job.jobType = 'remote';
            }
            if (item.datePosted) job.postedDateIsoString = new Date(item.datePosted).toISOString();
            if (item.validThrough) job.deadlineIsoString = new Date(item.validThrough).toISOString();

            // Salary handling – expects structured data like {"salaryCurrency":"USD","baseSalary":{"value":5000}}
            if (item.baseSalary && typeof item.baseSalary === 'object') {
              if (item.baseSalary.value) {
                const val = Number(item.baseSalary.value);
                if (!isNaN(val)) job.salaryMin = val;
              }
              if (item.baseSalary.maxValue) {
                const max = Number(item.baseSalary.maxValue);
                if (!isNaN(max)) job.salaryMax = max;
              }
              if (item.salaryCurrency) job.salaryCurrency = item.salaryCurrency;
            }

            result.push(job);
          }
        });
      }
    });
  };

  // The JSON‑LD can be an object or an array; handle both
  if (Array.isArray(data)) {
    data.forEach((entry) => {
      if (entry && entry['@graph']) processGraph(entry['@graph']);
    });
  } else if (data && data['@graph']) {
    processGraph(data['@graph']);
  }
});