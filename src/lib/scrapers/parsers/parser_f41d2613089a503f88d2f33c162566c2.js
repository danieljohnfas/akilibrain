const job = {};

const pageTitle = $('title').text().trim();
const titleMatch = pageTitle.match(/^(.+?)\s*\|\s*amarebe\.com$/);
job.title = titleMatch ? titleMatch[1].trim() : pageTitle;

const titleParts = job.title.split(' at ');
if (titleParts.length > 1) {
    job.title = titleParts[0].trim();
    const companyPart = titleParts[1].split(':')[0].trim();
    job.companyName = companyPart;
} else {
    job.companyName = 'NISR';
}

const deadlineMatch = pageTitle.match(/Application Deadline\s+([^|]+)/i);
if (deadlineMatch) {
    const deadlineStr = deadlineMatch[1].trim();
    const date = new Date(deadlineStr);
    if (!isNaN(date.getTime())) {
        job.deadlineIsoString = date.toISOString();
    }
}

const content = $('.entry-content, .post-content, .content, article').first();
job.description = content.text().trim().substring(0, 5000);

const locationMatch = content.text().match(/location[:\s]+([^\n.]+)/i);
if (locationMatch) {
    job.location = locationMatch[1].trim();
} else {
    job.location = 'Rwanda';
}

job.jobType = 'full_time';

const canonical = $('link[rel="canonical"]').attr('href');
job.sourceUrl = canonical || '';

const postedMatch = content.text().match(/posted[:\s]+([^\n.]+)/i);
if (postedMatch) {
    const postedDate = new Date(postedMatch[1].trim());
    if (!isNaN(postedDate.getTime())) {
        job.postedDateIsoString = postedDate.toISOString();
    }
}

if (job.title && job.title.toLowerCase() !== 'amarebe.com') {
    result.push(job);
}