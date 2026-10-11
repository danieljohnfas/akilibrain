// Extract job details from the page
const job = {};

// Extract title from the main heading or title tag
const titleElement = $('h1').first();
if (titleElement.length) {
    job.title = titleElement.text().trim();
} else {
    // Fallback to document title
    const docTitle = $('title').text().trim();
    if (docTitle) {
        job.title = docTitle.split('|')[0].trim();
    }
}

// Extract company name from various possible locations
const companyElement = $('.company-name, .employer, [class*="company"]');
if (companyElement.length) {
    job.companyName = companyElement.first().text().trim();
} else {
    // Try to extract from title pattern "Job Title at Company Name"
    if (job.title && job.title.includes(' at ')) {
        job.companyName = job.title.split(' at ')[1].split(',')[0].trim();
    }
}

// Extract description from meta tags or content
const metaDescription = $('meta[name="description"]');
if (metaDescription.length) {
    job.description = metaDescription.attr('content').trim();
} else {
    const descElement = $('.job-description, .description, #description');
    if (descElement.length) {
        job.description = descElement.first().text().trim();
    }
}

// Extract location
const locationElement = $('.location, .job-location, [class*="location"]');
if (locationElement.length) {
    job.location = locationElement.first().text().trim();
} else if (job.title && job.title.includes(',')) {
    const parts = job.title.split(',');
    if (parts.length > 1) {
        job.location = parts[parts.length - 1].trim();
    }
}

// Extract source URL
const canonicalLink = $('link[rel="canonical"]');
if (canonicalLink.length) {
    job.sourceUrl = canonicalLink.attr('href');
} else {
    job.sourceUrl = window.location.href;
}

// Extract job type if available
const jobTypeElement = $('.job-type, .employment-type, [class*="type"]');
if (jobTypeElement.length) {
    const jobType = jobTypeElement.first().text().trim().toLowerCase();
    if (jobType.includes('full') || jobType.includes('full-time')) {
        job.jobType = 'full_time';
    } else if (jobType.includes('part') || jobType.includes('part-time')) {
        job.jobType = 'part_time';
    } else if (jobType.includes('contract')) {
        job.jobType = 'contract';
    } else if (jobType.includes('intern')) {
        job.jobType = 'internship';
    } else if (jobType.includes('remote')) {
        job.jobType = 'remote';
    }
}

// Extract dates if available
const postedDateElement = $('.posted-date, .date-posted, [class*="date"]');
if (postedDateElement.length) {
    const dateText = postedDateElement.first().text().trim();
    const postedDate = new Date(dateText);
    if (!isNaN(postedDate.getTime())) {
        job.postedDateIsoString = postedDate.toISOString();
    }
}

const deadlineElement = $('.deadline, .closing-date, [class*="deadline"]');
if (deadlineElement.length) {
    const deadlineText = deadlineElement.first().text().trim();
    const deadline = new Date(deadlineText);
    if (!isNaN(deadline.getTime())) {
        job.deadlineIsoString = deadline.toISOString();
    }
}

// Extract salary if available
const salaryElement = $('.salary, .pay, [class*="salary"]');
if (salaryElement.length) {
    const salaryText = salaryElement.first().text().trim();
    const salaryMatch = salaryText.match(/[\d,]+/g);
    if (salaryMatch && salaryMatch.length > 0) {
        const salaries = salaryMatch.map(s => parseInt(s.replace(/,/g, '')));
        if (salaries.length === 1) {
            job.salaryMin = salaries[0];
            job.salaryMax = salaries[0];
        } else if (salaries.length >= 2) {
            job.salaryMin = salaries[0];
            job.salaryMax = salaries[1];
        }
        // Try to determine currency
        if (salaryText.includes('$') || salaryText.includes('USD')) {
            job.salaryCurrency = 'USD';
        } else if (salaryText.includes('€') || salaryText.includes('EUR')) {
            job.salaryCurrency = 'EUR';
        } else if (salaryText.includes('£') || salaryText.includes('GBP')) {
            job.salaryCurrency = 'GBP';
        } else if (salaryText.includes('TZS')) {
            job.salaryCurrency = 'TZS';
        }
    }
}

// Only push if we have at least a title
if (job.title) {
    result.push(job);
}