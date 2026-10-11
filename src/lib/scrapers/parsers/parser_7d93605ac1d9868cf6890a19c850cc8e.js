function cleanText(text) {
    return text ? text.replace(/\s+/g, ' ').trim() : '';
}

function parseDate(dateString) {
    try {
        if (!dateString) return null;
        // Attempt to parse common ISO 8601 formats
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date.toISOString();
    } catch (e) {
        return null;
    }
}

const pageTitle = cleanText($('meta[property="og:title"]').attr('content') || '');
let companyName = '';
// Attempt to extract company name from the page title, e.g., "Jobs At Company Name July YYYY"
const companyNameMatch = pageTitle.match(/At ([^|]+?) (?:July \d{4})?/);
if (companyNameMatch && companyNameMatch[1]) {
    companyName = cleanText(companyNameMatch[1]);
} else {
    // Fallback: extract from description meta tag if the title pattern isn't matched
    const description = cleanText($('meta[name="description"]').attr('content') || '');
    const companyNameDescMatch = description.match(/Jobs at ([^,]+)/i);
    if (companyNameDescMatch && companyNameDescMatch[1]) {
        companyName = cleanText(companyNameDescMatch[1]);
    }
}

const sourceUrl = $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content') || '';
const postedDateIsoString = parseDate($('meta[property="article:published_time"]').attr('content'));

// The provided HTML sample is incomplete and lacks the <body> content where job listings would typically reside.
// It is mostly the <head> section and an incomplete JSON-LD script.
// As per CRITICAL INSTRUCTIONS 2 & 3 ("If this HTML does NOT contain real job postings... you MUST leave the result array empty.
// Only extract actual job listings with a clear job title."),
// this script will not find any actual job postings in the given HTML sample.
// Therefore, the 'result' array will naturally remain empty, fulfilling the instructions.
//
// However, to provide a "deterministic Cheerio script" that would work if the body content
// were present and followed a common structure (e.g., a WordPress article listing multiple jobs),
// we define selectors and logic for such a hypothetical structure.

// Assume main article content is within a div with class 'entry-content' (common for WordPress posts)
const entryContent = $('.entry-content');

if (entryContent.length > 0) {
    let currentJob = null; // To build a job object as we iterate through related elements

    entryContent.children().each((i, el) => {
        const $el = $(el);

        if ($el.is('h2') || $el.is('h3')) {
            const potentialTitle = cleanText($el.text());
            // Heuristic: check if the heading text looks like a job title
            // (e.g., starts with a number, or contains "POSITION" or "JOB TITLE")
            if (potentialTitle && (potentialTitle.match(/^\d+\.\s*/) || potentialTitle.toLowerCase().includes('position') || potentialTitle.toLowerCase().includes('job title'))) {
                // If a new job title is found, finalize the previous job (if any) and start a new one
                if (currentJob && currentJob.title) {
                    result.push(currentJob);
                }
                currentJob = {
                    title: potentialTitle.replace(/^\d+\.\s*/, ''), // Remove numbering like "1. "
                    companyName: companyName,
                    sourceUrl: sourceUrl,
                    postedDateIsoString: postedDateIsoString,
                    description: '', // Will be populated from subsequent P tags
                    location: '',
                    jobType: '',
                    deadlineIsoString: null,
                    salaryMin: null,
                    salaryMax: null,
                    salaryCurrency: null
                };
            }
        } else if (currentJob) {
            // If we are currently processing a job and find relevant content elements
            if ($el.is('p')) {
                currentJob.description += (currentJob.description ? '\n\n' : '') + cleanText($el.text());
            } else if ($el.is('ul') || $el.is('ol')) {
                $el.find('li').each((idx, li) => {
                    const liText = cleanText($(li).text());
                    if (liText.toLowerCase().includes('location:')) {
                        currentJob.location = liText.replace(/location:\s*/i, '');
                    } else if (liText.toLowerCase().includes('job type:')) {
                        const type = liText.replace(/job type:\s*/i, '').toLowerCase();
                        if (type.includes('full-time')) currentJob.jobType = 'full_time';
                        else if (type.includes('part-time')) currentJob.jobType = 'part_time';
                        else if (type.includes('contract')) currentJob.jobType = 'contract';
                        else if (type.includes('internship')) currentJob.jobType = 'internship';
                        else if (type.includes('remote')) currentJob.jobType = 'remote';
                    } else if (liText.toLowerCase().includes('deadline:') || liText.toLowerCase().includes('application deadline:')) {
                        const deadlineText = liText.replace(/deadline:\s*/i, '').replace(/application:\s*/i, '');
                        currentJob.deadlineIsoString = parseDate(deadlineText);
                    }
                    // Additional checks for salary if present in list items
                    const salaryMatch = liText.match(/salary:\s*([\d,\.]+)\s*(?:-?\s*([\d,\.]+))?\s*([A-Z]{3})/i);
                    if (salaryMatch) {
                        currentJob.salaryMin = parseFloat(salaryMatch[1].replace(/,/g, ''));
                        if (salaryMatch[2]) {
                            currentJob.salaryMax = parseFloat(salaryMatch[2].replace(/,/g, ''));
                        }
                        currentJob.salaryCurrency = salaryMatch[3].toUpperCase();
                    }
                });
            }
            // Further logic for other elements that might contain job details
        }
    });

    // Push the last processed job if it exists and has a title
    if (currentJob && currentJob.title) {
        result.push(currentJob);
    }
}