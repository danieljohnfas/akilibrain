const job = {};

// Source URL
job.sourceUrl = $('meta[property="og:url"]').attr('content') || '';

// Title
job.title = $('h1.heading-1').text().trim() || '';

// Company Name
job.companyName = $('h1.heading-1 + div.text-primary-text-dark-5-color.text-xl.font-bold').text().trim() || '';

// Description
// Extracting plain text description as per (string) instruction
job.description = $('div[data-job-description]').text().trim() || '';

// Location
job.location = $('.flex.items-center.text-primary-text-dark-5-color.text-xl.font-bold.gap-2.mb-8 span').text().trim() || '';

// Posted Date
job.postedDateIsoString = $('meta[property="article:published_time"]').attr('content') || null;

// Job Type
let foundJobType = null;
$('.flex.gap-2.flex-wrap div span').each((i, el) => {
    const text = $(el).text().trim().toLowerCase();
    if (text.includes('full time')) {
        foundJobType = 'full_time';
        return false; // Exit .each() loop once a type is found
    } else if (text.includes('part time')) {
        foundJobType = 'part_time';
        return false;
    } else if (text.includes('contract')) {
        foundJobType = 'contract';
        return false;
    } else if (text.includes('internship')) {
        foundJobType = 'internship';
        return false;
    }
    // Note: 'remote' is handled if it's the primary descriptor, but 'on site' implies not remote.
    // If 'full time' is explicitly mentioned, it takes precedence for jobType.
});
job.jobType = foundJobType;

// Optional fields not found in the provided HTML
job.deadlineIsoString = null;
job.salaryMin = null;
job.salaryMax = null;
job.salaryCurrency = null;

// Only push to result if a valid job title and description are found
if (job.title && job.description) {
    result.push(job);
}