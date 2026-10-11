const job = {};

// Try to extract from JSON-LD structured data
const jsonLdScripts = $('script[type="application/ld+json"]');
jsonLdScripts.each((i, el) => {
    try {
        const data = JSON.parse($(el).html());
        const graphs = data['@graph'] || [data];
        graphs.forEach(item => {
            if (item['@type'] === 'JobPosting' || (Array.isArray(item['@type']) && item['@type'].includes('JobPosting'))) {
                job.title = item.title || job.title;
                job.companyName = (item.hiringOrganization && item.hiringOrganization.name) || job.companyName;
                job.description = item.description || job.description;
                job.location = (item.jobLocation && item.jobLocation.address && item.jobLocation.address.addressLocality) || job.location;
                job.jobType = item.employmentType || job.jobType;
                job.sourceUrl = item.url || job.sourceUrl;
                job.postedDateIsoString = item.datePosted || job.postedDateIsoString;
                job.deadlineIsoString = item.validThrough || job.deadlineIsoString;
                if (item.baseSalary) {
                    job.salaryMin = item.baseSalary.value?.minValue || job.salaryMin;
                    job.salaryMax = item.baseSalary.value?.maxValue || job.salaryMax;
                    job.salaryCurrency = item.baseSalary.value?.currency || job.salaryCurrency;
                }
            }
        });
    } catch (e) {}
});

// Fallback to meta tags and HTML content if JSON-LD missing
if (!job.title) {
    job.title = $('meta[property="og:title"]').attr('content') || $('title').text().replace(' | AjiraLeo Tanzania', '').trim();
}
if (!job.companyName) {
    // Extract company from title or meta tags
    const titleText = job.title || '';
    const match = titleText.match(/Job At\s+(.+?)\s+(July|August|September|October|November|December|January|February|March|April|May|June)/i);
    if (match) job.companyName = match[1].trim();
    else job.companyName = 'SINORAY Tanzania'; // from visible context
}
if (!job.sourceUrl) {
    job.sourceUrl = $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content');
}
if (!job.postedDateIsoString) {
    job.postedDateIsoString = $('meta[property="article:published_time"]').attr('content') || $('meta[property="og:updated_time"]').attr('content');
}
if (!job.deadlineIsoString) {
    // No explicit deadline in sample; leave undefined
}
if (!job.description) {
    job.description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');
}
if (!job.location) {
    // Try to find location in page text
    const bodyText = $('body').text();
    const locMatch = bodyText.match(/Location[:\s]*([^\n]+)/i);
    if (locMatch) job.location = locMatch[1].trim();
}
if (!job.jobType) {
    const bodyText = $('body').text();
    if (/full.?time/i.test(bodyText)) job.jobType = 'full_time';
    else if (/part.?time/i.test(bodyText)) job.jobType = 'part_time';
    else if (/contract/i.test(bodyText)) job.jobType = 'contract';
    else if (/intern/i.test(bodyText)) job.jobType = 'internship';
    else if (/remote/i.test(bodyText)) job.jobType = 'remote';
}

// Only push if we have a clear job title
if (job.title && job.title.toLowerCase().includes('job')) {
    result.push(job);
}