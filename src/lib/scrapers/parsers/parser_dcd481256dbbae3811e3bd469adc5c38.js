const job = {};

// 1. Source URL
// Use canonical link first, then fallback to og:url
job.sourceUrl = $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content') || null;

// 2. Title and Company Name
const h1Element = $('.post_content h1');
let h1Text = h1Element.length ? h1Element.text().trim() : '';

let extractedTitle = null;
let extractedCompanyName = null;

// Attempt to parse "Job Title Job Vacancy at Company Name" from H1
if (h1Text) {
    const match = h1Text.match(/^(.*?)\s*Job Vacancy(?:\s*at\s*(.*?))?$/i);
    if (match) {
        extractedTitle = match[1].trim();
        extractedCompanyName = match[2] ? match[2].trim() : null;
    } else {
        // If pattern doesn't match, take the full H1 text as the title initially
        extractedTitle = h1Text;
    }
}

// Refine company name: If H1 extracted a short version (e.g., "ITM Tanzania"),
// but a nearby paragraph says "ITM Tanzania Limited", prefer the longer version.
if (extractedCompanyName) {
    const nextParagraph = h1Element.nextAll('p').first();
    if (nextParagraph.length) {
        const pText = nextParagraph.text().trim();
        // Check if the paragraph contains a more complete version of the company name
        const limitedRegex = new RegExp(`\\b${extractedCompanyName}\\s*(Limited|LLC|Inc|Corp|GmbH|S.A.|Ltd)\\b`, 'i');
        const limitedMatch = pText.match(limitedRegex);
        if (limitedMatch) {
            extractedCompanyName = limitedMatch[0].trim(); // Take the full matched string
        }
    }
}

// Fallback for company name if not found from H1 or refined from paragraph
if (!extractedCompanyName) {
    const ogImageAlt = $('meta[property="og:image:alt"]').attr('content');
    if (ogImageAlt) {
        const altMatch = ogImageAlt.match(/^(.*?)\s*Job Vacancy\s*at\s*(.*?)$/i);
        if (altMatch && altMatch[2]) {
            extractedCompanyName = altMatch[2].trim();
        }
    }
}

// Final cleanup for title (remove "Job Vacancy at Company Name" parts)
if (extractedTitle) {
    if (extractedCompanyName) {
        // Remove specific "at Company Name" if it exists
        extractedTitle = extractedTitle.replace(new RegExp(`\\s*at\\s*${extractedCompanyName}$`, 'i'), '').trim();
        // If the title still contains the company name (e.g., if "at" wasn't there)
        extractedTitle = extractedTitle.replace(new RegExp(`\\s*${extractedCompanyName}$`, 'i'), '').trim();
    }
    // Always remove "Job Vacancy" if present
    extractedTitle = extractedTitle.replace(/job vacancy/i, '').trim();
}

job.title = extractedTitle || null;
job.companyName = extractedCompanyName || null;

// 3. Description
let descriptionText = '';
const entryContent = $('.entry-content'); 
if (entryContent.length) {
    // Clone to remove unwanted elements without altering the original DOM
    const clonedContent = entryContent.clone();
    // Remove common non-description elements
    clonedContent.find('script, style, noscript, ins, .sharedaddy, .sd-social-icon-text, .wp-block-buttons, .post-navigation, .entry-meta').remove();
    // Get text, replace multiple newlines/spaces with single newlines, trim whitespace
    descriptionText = clonedContent.text().replace(/\s*\n\s*/g, '\n').trim();
} else {
    // Fallback to meta descriptions if .entry-content is not found
    descriptionText = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
}
job.description = descriptionText || null;

// 4. Posted Date
job.postedDateIsoString = $('meta[property="article:published_time"]').attr('content') || null;

// 5. Deadline
let deadlineDate = null;
const deadlineElement = $('.entry-content h3:contains("DEADLINE")').next('p');
if (deadlineElement.length) {
    const deadlineText = deadlineElement.text();
    const deadlineMatch = deadlineText.match(/(\d{1,2}(?:st|nd|rd|th)?)\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
    if (deadlineMatch) {
        const day = deadlineMatch[1].replace(/(st|nd|rd|th)/, '');
        const month = deadlineMatch[2];
        const year = deadlineMatch[3];
        try {
            // Using standard Date constructor for robustness; month parsing by name
            const dateStr = `${day} ${month} ${year}`;
            const parsedDate = new Date(dateStr);
            // Check if the date is valid and not 'Invalid Date'
            if (!isNaN(parsedDate.getTime())) {
                deadlineDate = parsedDate.toISOString();
            }
        } catch (e) {
            // Handle parsing error, deadlineDate remains null
        }
    }
}
job.deadlineIsoString = deadlineDate;

// 6. Location (scan description for keywords)
let jobLocation = null;
if (job.description) {
    const locationKeywords = ['Location:', 'Workplace:', 'Based in:', 'Duty Station:', 'Reporting To:'];
    const lowerDescription = job.description.toLowerCase();

    for (const keyword of locationKeywords) {
        // Regex to find keyword followed by text, ending at newline, period, or comma
        const regex = new RegExp(`${keyword.toLowerCase().replace(/:$/, '')}\\s*:\\s*(.*?)(?:\\n|\\.|,|$)`, 'i');
        const match = lowerDescription.match(regex);
        if (match && match[1]) {
            let extracted = match[1].trim();
            // Basic cleanup: if it includes "N/A" or "negotiable", ignore
            if (!extracted.toLowerCase().includes('n/a') && !extracted.toLowerCase().includes('negotiable') && extracted.length > 2) {
                 jobLocation = extracted.split(',')[0].trim(); // Take the first part before a comma for a cleaner city/country
                 break;
            }
        }
    }
}
job.location = jobLocation;

// 7. Job Type (scan description for keywords)
let jobTypeFound = null;
if (job.description) {
    const lowerDescription = job.description.toLowerCase();
    const typeMap = {
        'full_time': ['full-time', 'full time'],
        'part_time': ['part-time', 'part time'],
        'contract': ['contract', 'fixed-term'],
        'internship': ['internship', 'intern'],
        'remote': ['remote', 'work from home', 'wfh', 'telecommute']
    };
    for (const type in typeMap) {
        for (const keyword of typeMap[type]) {
            // Use word boundaries to avoid partial matches (e.g., "contractor" vs "contract")
            const regex = new RegExp(`\\b${keyword}\\b`, 'i');
            if (lowerDescription.match(regex)) {
                jobTypeFound = type;
                break;
            }
        }
        if (jobTypeFound) break;
    }
}
job.jobType = jobTypeFound;

// 8. Salary (not available in sample)
job.salaryMin = null;
job.salaryMax = null;
job.salaryCurrency = null;

// Push the job object to the global result array ONLY if a valid title is found.
// This ensures we only add actual job postings.
if (job.title) {
    result.push(job);
}