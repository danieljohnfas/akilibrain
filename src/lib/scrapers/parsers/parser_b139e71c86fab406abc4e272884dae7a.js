$('.job-listing, .job-card, .listing-item, [data-testid="job-post"], [role="listitem"]').each((index, element) => {
    const $job = $(element);

    const title = $job.find('.job-title, h2 a, h3 a, [data-testid="job-title"]').first().text().trim();
    if (!title) {
        // Must have a clear title to be considered a job posting
        return;
    }

    const companyName = $job.find('.company-name, .company-info span, [data-testid="company-name"]').first().text().trim();
    const description = $job.find('.job-description, .description-text, [data-testid="job-description"]').first().text().trim();
    const location = $job.find('.job-location, .location-text, [data-testid="job-location"]').first().text().trim();
    
    let jobType = $job.find('.job-type, .type-label, [data-testid="job-type"]').first().text().trim().toLowerCase();
    let jobTypeMapped = '';
    if (jobType.includes('full-time')) {
        jobTypeMapped = 'full_time';
    } else if (jobType.includes('part-time')) {
        jobTypeMapped = 'part_time';
    } else if (jobType.includes('contract')) {
        jobTypeMapped = 'contract';
    } else if (jobType.includes('internship')) {
        jobTypeMapped = 'internship';
    } else if (jobType.includes('remote')) {
        jobTypeMapped = 'remote';
    } else if (jobType.includes('temporary')) {
        jobTypeMapped = 'contract'; // Closest match
    }

    const sourceUrlElement = $job.find('a.job-link, a[href*="/jobs/"], a[itemprop="url"]').first();
    let sourceUrl = sourceUrlElement.attr('href');
    if (sourceUrl) {
        // Ensure URL is absolute. Assuming base URL is available, otherwise use a placeholder.
        sourceUrl = new URL(sourceUrl, 'https://example.com').href; // Replace example.com with actual base if known
    }

    const postedDateText = $job.find('.posted-date, .date-posted, time[datetime]').first();
    let postedDateIsoString = '';
    if (postedDateText.is('time') && postedDateText.attr('datetime')) {
        postedDateIsoString = postedDateText.attr('datetime');
    } else if (postedDateText.text().trim().includes('ago')) {
        // Simple heuristic for "X days ago" - needs proper date parsing for real use
        postedDateIsoString = new Date().toISOString();
    }

    // Salary extraction (very basic example, often complex)
    const salaryText = $job.find('.salary, [data-testid="salary"]').first().text().trim();
    let salaryMin = null;
    let salaryMax = null;
    let salaryCurrency = '';

    const match = salaryText.match(/(\$|€|£)\s*([\d,]+)\s*(?:-\s*([\d,]+))?/);
    if (match) {
        salaryCurrency = match[1] || '';
        salaryMin = parseFloat(match[2].replace(/,/g, ''));
        if (match[3]) {
            salaryMax = parseFloat(match[3].replace(/,/g, ''));
        }
    }


    result.push({
        title: title,
        companyName: companyName || '',
        description: description || '',
        location: location || '',
        jobType: jobTypeMapped,
        sourceUrl: sourceUrl || '',
        postedDateIsoString: postedDateIsoString,
        deadlineIsoString: '', // Not typically found in card structures
        salaryMin: salaryMin,
        salaryMax: salaryMax,
        salaryCurrency: salaryCurrency
    });
});