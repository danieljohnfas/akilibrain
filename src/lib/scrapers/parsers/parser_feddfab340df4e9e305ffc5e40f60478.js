const job = {};

const canonicalUrl = $('link[rel="canonical"]').attr('href');
if (canonicalUrl) {
    job.sourceUrl = canonicalUrl.trim();
} else {
    const ogUrl = $('meta[property="og:url"]').attr('content');
    if (ogUrl) {
        job.sourceUrl = ogUrl.trim();
    }
}

if (!job.sourceUrl) {
    return;
}

const ogTitle = $('meta[property="og:title"]').attr('content');

if (ogTitle) {
    let rawTitle = ogTitle.trim();
    
    const jobTitleCompanyMatch = rawTitle.match(/^(.*?)\s+(?:Vacancy|Job)\s+at\s+(.*?)(?:\s+\d{4})?$/i);

    if (jobTitleCompanyMatch && jobTitleCompanyMatch[1] && jobTitleCompanyMatch[2]) {
        job.title = jobTitleCompanyMatch[1].trim();
        let companyPart = jobTitleCompanyMatch[2].trim();
        const yearSuffixMatch = companyPart.match(/^(.*?)(?:\s+\d{4})$/);
        if (yearSuffixMatch && yearSuffixMatch[1]) {
            job.companyName = yearSuffixMatch[1].trim();
        } else {
            job.companyName = companyPart;
        }
    } else {
        return; 
    }
} else {
    return;
}

if (!job.title) {
    return;
}

const descriptionElement = $('.entry-content.clear');
if (descriptionElement.length) {
    job.description = descriptionElement.text().trim().replace(/\s\s+/g, ' ');
}

const publishedTime = $('meta[property="article:published_time"]').attr('content');
if (publishedTime) {
    job.postedDateIsoString = publishedTime.trim();
}

if (job.title) { 
    result.push(job);
}