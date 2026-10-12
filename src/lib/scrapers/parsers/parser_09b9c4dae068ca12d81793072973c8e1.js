function parseRelativeDate(dateString) {
    if (!dateString) return null;

    const lowerDateString = dateString.toLowerCase();
    const now = new Date();

    if (lowerDateString.includes('today')) {
        return now.toISOString();
    }
    if (lowerDateString.includes('yesterday')) {
        now.setDate(now.getDate() - 1);
        return now.toISOString();
    }

    const parts = lowerDateString.match(/(\d+)\s+(day|week|month|year)s?\s+ago/);
    if (parts && parts.length >= 3) {
        const value = parseInt(parts[1], 10);
        const unit = parts[2];

        switch (unit) {
            case 'day':
                now.setDate(now.getDate() - value);
                break;
            case 'week':
                now.setDate(now.getDate() - (value * 7));
                break;
            case 'month':
                now.setMonth(now.getMonth() - value);
                break;
            case 'year':
                now.setFullYear(now.getFullYear() - value);
                break;
        }
        return now.toISOString();
    }

    return null;
}

// The provided HTML sample only contains the <head> section and no actual job listings in the <body>.
// Therefore, any selector for job cards will yield an empty set.
// The script is designed to correctly produce an empty result array in this scenario,
// adhering to the instruction: "If this HTML does NOT contain real job postings... you MUST leave the result array empty."
// The selectors below are hypothetical, based on common patterns for job boards and classes often seen in Next.js applications (like `div[class*="jobCardContainer"]`)
// or descriptive utility classes that would form a job card (e.g., `div.p-8.text-sm...`).
$('div[class*="jobCardContainer"], article[class*="jobCardContainer"], div.p-8.text-sm.md\\:border-l.border-b.border-gray-100.flex-grow.relative.bg-white.dark\\:bg-zinc-900').each((index, element) => {
    const $job = $(element);

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

    const titleElement = $job.find('h2.font-bold, h3').first();
    job.title = titleElement.text().trim();

    if (!job.title) {
        return; // Skip this card if no clear job title is found.
    }

    const sourceLink = titleElement.parent('a');
    if (sourceLink.length) {
        let href = sourceLink.attr('href');
        if (href) {
            job.sourceUrl = href.startsWith('/') ? 'https://realanalystjobs.com' + href : href;
        }
    }

    job.description = $job.find('div[class*="line-clamp-3"]').text().trim() || null;

    let companyFound = false;
    let locationFound = false;
    let jobTypeFound = false;
    let postedDateFound = false;

    // Iterate through common detail lines, assuming a typical order: Company, Location, Job Type, Posted Date.
    // These detail lines often appear as <p> tags containing an SVG icon and a <span> with the text.
    $job.find('p.flex.items-center.gap-1.text-gray-500 span').each((i, spanEl) => {
        const text = $(spanEl).text().trim();
        const lowerText = text.toLowerCase();

        if (text === '') return;

        // Check for Posted Date first
        if (!postedDateFound && (lowerText.includes('ago') || lowerText.includes('today') || lowerText.includes('yesterday'))) {
            job.postedDateIsoString = parseRelativeDate(text);
            postedDateFound = true;
            return;
        }

        // Check for Job Type keywords
        if (!jobTypeFound) {
            if (lowerText.includes('full time')) {
                job.jobType = 'full_time';
                jobTypeFound = true;
                return;
            } else if (lowerText.includes('part time')) {
                job.jobType = 'part_time';
                jobTypeFound = true;
                return;
            } else if (lowerText.includes('contract')) {
                job.jobType = 'contract';
                jobTypeFound = true;
                return;
            } else if (lowerText.includes('internship')) {
                job.jobType = 'internship';
                jobTypeFound = true;
                return;
            }
        }
        
        // Handle 'remote' which can be both job type and location
        if (lowerText.includes('remote')) {
            if (!jobTypeFound) {
                job.jobType = 'remote';
                jobTypeFound = true;
            }
            if (!locationFound) {
                job.location = text;
                locationFound = true;
            }
            return;
        }

        // Heuristic to assign company and location based on order and content
        if (!companyFound && !jobTypeFound && !postedDateFound) { // If company not found yet and not a known job type/date
            job.companyName = text;
            companyFound = true;
            return;
        }

        if (companyFound && !locationFound && !jobTypeFound && !postedDateFound) { // If company is found, but location not yet, and not a known job type/date
            job.location = text;
            locationFound = true;
            return;
        }
    });

    result.push(job);
});