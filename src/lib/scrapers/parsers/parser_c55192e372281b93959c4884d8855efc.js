// Extract job details from the Davis & Shirtliff job posting page
const job = {};

// Extract title from page title or heading
const pageTitle = $('title').text().trim();
if (pageTitle) {
    // Remove company name suffix if present
    const titleMatch = pageTitle.match(/^([^\-]+(?:\s*-\s*[^-]+)*?)\s*-\s*Davis\s*&\s*Shirtliff/i);
    if (titleMatch) {
        job.title = titleMatch[1].trim();
    } else {
        job.title = pageTitle.split(' - ')[0].trim();
    }
}

// Extract company name
const companyMatch = pageTitle.match(/Davis\s*&\s*Shirtliff[^]*/i);
if (companyMatch) {
    job.companyName = companyMatch[0].trim();
} else {
    // Look for company name in the page content
    const companyElements = $('h1, h2, .company, .organization, .brand');
    for (let i = 0; i < companyElements.length; i++) {
        const text = $(companyElements[i]).text().trim();
        if (text.toLowerCase().includes('davis') && text.toLowerCase().includes('shirtliff')) {
            job.companyName = text;
            break;
        }
    }
}

// Extract description from meta tag or content
const metaDescription = $('meta[name="description"]').attr('content');
if (metaDescription) {
    job.description = metaDescription.trim();
} else {
    // Try to extract from main content
    const content = $('p, .content, .description, .job-description').first();
    if (content.length) {
        job.description = content.text().trim();
    }
}

// Extract location from title or content
if (pageTitle.toLowerCase().includes('tanzania')) {
    job.location = 'Tanzania';
} else {
    // Look for location patterns in content
    const locationPatterns = [
        /location\s*:\s*([^,\n]+)/i,
        /based\s+in\s+([^,\n]+)/i,
        /([^,\n]*(?:tanzania|kenya|uganda|rwanda)[^,\n]*)/i
    ];
    
    const pageText = $('body').text();
    for (const pattern of locationPatterns) {
        const match = pageText.match(pattern);
        if (match) {
            job.location = match[1].trim();
            break;
        }
    }
}

// Extract job type based on title or content
const jobTypePatterns = [
    { pattern: /full[\s-]?time/i, type: 'full_time' },
    { pattern: /part[\s-]?time/i, type: 'part_time' },
    { pattern: /contract/i, type: 'contract' },
    { pattern: /internship/i, type: 'internship' },
    { pattern: /temporary/i, type: 'contract' }
];

const pageText = $('body').text();
for (const { pattern, type } of jobTypePatterns) {
    if (pattern.test(pageText) || pattern.test(job.title || '')) {
        job.jobType = type;
        break;
    }
}

// Extract source URL from base tag or current URL
const baseHref = $('base').attr('href');
if (baseHref) {
    job.sourceUrl = baseHref;
} else {
    // Fallback to construct from window location if available
    job.sourceUrl = window.location ? window.location.href : '';
}

// Extract dates if available
const datePatterns = [
    { pattern: /posted\s+(?:on\s+)?([a-z]+\s+\d{1,2},?\s+\d{4})/i, field: 'postedDate' },
    { pattern: /deadline\s*:\s*([a-z]+\s+\d{1,2},?\s+\d{4})/i, field: 'deadline' },
    { pattern: /apply\s+by\s+([a-z]+\s+\d{1,2},?\s+\d{4})/i, field: 'deadline' }
];

for (const { pattern, field } of datePatterns) {
    const match = pageText.match(pattern);
    if (match) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
            if (field === 'postedDate') {
                job.postedDateIsoString = date.toISOString();
            } else if (field === 'deadline') {
                job.deadlineIsoString = date.toISOString();
            }
        }
    }
}

// Extract salary information if available
const salaryPatterns = [
    /(?:salary|pay|compensation)\s*:\s*(?:\$|USD|TZS|KES)?\s*([\d,]+)\s*(?:to|[-–])\s*(?:\$|USD|TZS|KES)?\s*([\d,]+)/i,
    /(?:salary|pay|compensation)\s*:\s*(?:\$|USD|TZS|KES)?\s*([\d,]+)/i
];

for (const pattern of salaryPatterns) {
    const match = pageText.match(pattern);
    if (match) {
        if (match[2]) {
            job.salaryMin = parseInt(match[1].replace(/,/g, ''));
            job.salaryMax = parseInt(match[2].replace(/,/g, ''));
        } else {
            job.salaryMin = parseInt(match[1].replace(/,/g, ''));
            job.salaryMax = parseInt(match[1].replace(/,/g, ''));
        }
        
        // Determine currency
        if (pageText.match(/USD|\$/i)) {
            job.salaryCurrency = 'USD';
        } else if (pageText.match(/TZS/i)) {
            job.salaryCurrency = 'TZS';
        } else if (pageText.match(/KES/i)) {
            job.salaryCurrency = 'KES';
        }
        break;
    }
}

// Only push if we have a valid job title (critical field)
if (job.title && job.title.toLowerCase() !== 'page not found' && 
    !job.title.toLowerCase().includes('error') && job.title.trim().length > 3) {
    result.push(job);
}