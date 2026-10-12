var job = {};

// Extract title from the page title or a clear heading
var pageTitle = $('title').text();
if (pageTitle.includes(' at ')) {
    job.title = pageTitle.split(' at ')[0].trim();
    // Also try to extract company from the page title
    var companyMatch = pageTitle.match(/at\s([^-\s]+)/);
    if (companyMatch) {
        job.companyName = companyMatch[1].trim();
    }
} else {
    // Look for a prominent heading like h1, h2
    var h1Title = $('.p-title-value').text().trim();
    if (h1Title) {
        job.title = h1Title;
        // Try to get company from h1 if not already found
        var h1CompanyMatch = h1Title.match(/at\s([^-\s]+)/);
        if (h1CompanyMatch && !job.companyName) {
            job.companyName = h1CompanyMatch[1].trim();
        }
    }
}

// Extract company name if not found from title, look in description or specific elements
if (!job.companyName) {
    var companyFromMeta = $('meta[property="og:description"]').attr('content');
    if (companyFromMeta && companyFromMeta.includes('Employer:')) {
        var employerMatch = companyFromMeta.match(/Employer:\s*([^)]+)/);
        if (employerMatch) {
            job.companyName = employerMatch[1].replace(/\(UDOM\)/, '').trim();
        }
    }
    // Specific element check for company name
    $('.block-body dl.pairs dd').each(function() {
        var dtText = $(this).prev('dt').text().trim();
        if (dtText.includes('Employer') || dtText.includes('Company')) {
            job.companyName = $(this).text().trim();
            return false; // break the loop
        }
    });
}

// Extract description from the main content area
var descriptionContainer = $('.block-body .bbWrapper').first();
if (descriptionContainer.length) {
    job.description = descriptionContainer.text().trim();
} else {
    // Fallback to meta description
    job.description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
}


// Extract sourceUrl
job.sourceUrl = $('link[rel="canonical"]').attr('href') || window.location.href;

// Extract postedDateIsoString (if available, not clear in this HTML)
// Not directly visible in the provided HTML. Could be in a specific date element or meta tag not shown.

// Extract deadlineIsoString from the title or description
var deadlineMatchTitle = pageTitle.match(/-\s*(\d{2}-\d{2}-\d{4})/);
if (deadlineMatchTitle && deadlineMatchTitle[1]) {
    var dateParts = deadlineMatchTitle[1].split('-');
    // Assuming DD-MM-YYYY format
    var isoDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    job.deadlineIsoString = new Date(isoDate).toISOString();
} else {
    var deadlineMatchDesc = descriptionContainer.text().match(/Deadline:\s*(\d{1,2}\s+\w+\s+\d{4})/i);
    if (deadlineMatchDesc && deadlineMatchDesc[1]) {
        try {
            var date = new Date(deadlineMatchDesc[1]);
            if (!isNaN(date.getTime())) {
                job.deadlineIsoString = date.toISOString();
            }
        } catch (e) { /* ignore parsing errors */ }
    }
}

// Check if a job title was successfully extracted.
// If the title is generic or empty, it's likely not a real job posting.
if (job.title && job.title.toLowerCase().includes('driver ii')) {
    result.push(job);
}