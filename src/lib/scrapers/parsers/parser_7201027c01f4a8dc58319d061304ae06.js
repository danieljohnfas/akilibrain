// Extract job data from JSON-LD schema first
const schemaScript = $('script[type="application/ld+json"]').html();
let jobData = {};

if (schemaScript) {
    try {
        const schema = JSON.parse(schemaScript);
        if (schema['@graph']) {
            for (const item of schema['@graph']) {
                if (item['@type'] === 'JobPosting') {
                    jobData = item;
                    break;
                }
            }
        } else if (schema['@type'] === 'JobPosting') {
            jobData = schema;
        }
    } catch (e) {
        // ignore parse error
    }
}

// Fallback to meta tags if schema not found
const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
const publishedTime = $('meta[property="article:published_time"]').attr('content') || '';

// Extract company and location from title if possible
let companyName = '';
let location = '';
if (title.includes(' at ')) {
    const parts = title.split(' at ');
    if (parts.length > 1) {
        companyName = parts[1].split(',')[0].trim();
        location = parts[1].replace(companyName, '').replace(/^,\s*/, '').trim();
    }
}

// Try to get description from page content if not in meta
let fullDescription = description;
const articleContent = $('.entry-content, .post-content, article, .job-description, .content').first();
if (articleContent.length && !fullDescription) {
    fullDescription = articleContent.text().trim().substring(0, 5000);
}

// Determine job type from content (default to full_time)
let jobType = 'full_time';
const textContent = $('body').text().toLowerCase();
if (textContent.includes('part.time') || textContent.includes('part-time')) jobType = 'part_time';
else if (textContent.includes('contract')) jobType = 'contract';
else if (textContent.includes('internship') || textContent.includes('intern')) jobType = 'internship';
else if (textContent.includes('remote') || textContent.includes('work from home')) jobType = 'remote';

// Parse salary if available in schema
let salaryMin = null, salaryMax = null, salaryCurrency = '';
if (jobData.baseSalary) {
    const salary = jobData.baseSalary;
    if (salary.value) {
        if (salary.value.minValue) salaryMin = parseFloat(salary.value.minValue);
        if (salary.value.maxValue) salaryMax = parseFloat(salary.value.maxValue);
        salaryCurrency = salary.currency || '';
    } else if (typeof salary.value === 'number') {
        salaryMin = salaryMax = salary.value;
        salaryCurrency = salary.currency || '';
    }
}

// Build job object
const job = {
    title: jobData.title || title.replace(/ - assengaonline\.com.*$/, '').trim(),
    companyName: jobData.hiringOrganization?.name || companyName || 'Bravo Group',
    description: jobData.description || fullDescription,
    location: jobData.jobLocation?.address?.addressLocality || jobData.jobLocation?.address?.addressRegion || location || 'Dar es Salaam, Tanzania',
    jobType: jobData.employmentType ? jobData.employmentType.toLowerCase().replace(/\s+/g, '_') : jobType,
    sourceUrl: canonicalUrl,
    postedDateIsoString: jobData.datePosted || publishedTime,
    deadlineIsoString: jobData.validThrough || '',
    salaryMin,
    salaryMax,
    salaryCurrency
};

// Only push if we have a valid title
if (job.title) {
    result.push(job);
}