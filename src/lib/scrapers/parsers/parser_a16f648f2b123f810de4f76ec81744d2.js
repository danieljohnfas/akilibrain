const job = {
    title: null,
    companyName: null,
    description: null,
    location: null,
    jobType: null,
    sourceUrl: null,
    postedDateIsoString: null,
    deadlineIsoString: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null
};

// Extract title
const pageTitle = $('title').text().trim();
if (pageTitle) {
    job.title = pageTitle.replace(/ Job Vacancy \d{4}$/, '').trim();
}

// Only proceed if a clear job title is identified
if (job.title && job.title.length > 5) { // Minimum length to avoid generic titles
    // Extract sourceUrl
    job.sourceUrl = $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content') || null;

    // Extract postedDateIsoString
    job.postedDateIsoString = $('meta[property="article:published_time"]').attr('content') || null;

    // Extract description
    job.description = $('meta[property="og:description"]').attr('content') || null;

    // Extract companyName
    if (job.description) {
        // Look for common patterns like "Company Name is inviting qualified candidates"
        const descCompanyMatch = job.description.match(/([A-Z][a-zA-Z\s&'-]*\s*\(?[A-Z]{2,}\)?) is inviting qualified candidates/);
        if (descCompanyMatch && descCompanyMatch[1]) {
            job.companyName = descCompanyMatch[1].trim();
        }
    }
    // Fallback: try to extract from the title if not found in description, assuming "Company Role" structure
    if (!job.companyName && job.title) {
        const titleCompanyMatch = job.title.match(/^([A-Z\s&-]+?)(?:\s+Legal|\s+Officer|\s+Manager|\s+Engineer|\s+Developer|\s+Analyst|\s+Specialist|\s+Assistant|\s+Consultant|\s+Director|\s+Coordinator)/);
        if (titleCompanyMatch && titleCompanyMatch[1]) {
            job.companyName = titleCompanyMatch[1].trim();
        } else {
             // Simpler fallback, take first word if common job keywords not found
             job.companyName = job.title.split(' ')[0];
        }
    }


    // Extract location
    if (job.description) {
        const locationMatch = job.description.match(/based in ([A-Za-z\s,-]+)(?:\.|\s*This)/); // Catches "based in X." or "based in X This"
        if (locationMatch && locationMatch[1]) {
            job.location = locationMatch[1].trim();
        }
    }

    // Push the extracted job to the result array
    result.push(job);
}