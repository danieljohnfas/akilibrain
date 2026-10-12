$('.views-row').each((index, element) => {
    const $job = $(element);
    const job = {};

    // Source URL and Title
    const titleLink = $job.find('.node__title a');
    if (titleLink.length) {
        job.title = titleLink.text().trim();
        const relativeUrl = titleLink.attr('href');
        if (relativeUrl) {
            // Assuming base URL from the canonical link in the head
            // <link rel="canonical" href="https://tanzania.un.org/en/jobs" />
            job.sourceUrl = 'https://tanzania.un.org' + relativeUrl;
        }
    }

    // Company Name
    // On UN sites, the company is often implicitly "United Nations" or a specific agency.
    // If a specific field exists, use it, otherwise default.
    const companyElement = $job.find('.field--name-field-company .field__item'); // Hypothetical selector
    job.companyName = companyElement.length ? companyElement.text().trim() : 'United Nations';

    // Description (often a summary on listing pages)
    const descriptionElement = $job.find('.field--name-body .field__item p'); // Hypothetical selector for paragraph in description
    if (descriptionElement.length) {
        job.description = descriptionElement.first().text().trim();
    } else {
        const fallbackDescription = $job.find('.field--name-body .field__item'); // Fallback to raw field item
        if (fallbackDescription.length) {
            job.description = fallbackDescription.first().text().trim();
        }
    }

    // Location
    const locationElement = $job.find('.field--name-field-location .field__item'); // Hypothetical selector
    if (locationElement.length) {
        job.location = locationElement.text().trim();
    }

    // Job Type
    const jobTypeElement = $job.find('.field--name-field-job-type .field__item'); // Hypothetical selector
    if (jobTypeElement.length) {
        const typeText = jobTypeElement.text().trim().toLowerCase();
        if (typeText.includes('full-time')) {
            job.jobType = 'full_time';
        } else if (typeText.includes('part-time')) {
            job.jobType = 'part_time';
        } else if (typeText.includes('contract')) {
            job.jobType = 'contract';
        } else if (typeText.includes('internship')) {
            job.jobType = 'internship';
        } else if (typeText.includes('remote') || (job.location && job.location.toLowerCase().includes('remote'))) {
            job.jobType = 'remote';
        }
    }

    // Posted Date
    const postedDateElement = $job.find('.field--name-field-posted-date .field__item'); // Hypothetical selector
    if (postedDateElement.length) {
        try {
            const dateText = postedDateElement.text().trim();
            const date = new Date(dateText);
            if (!isNaN(date.getTime())) {
                job.postedDateIsoString = date.toISOString();
            }
        } catch (e) {
            // Date parsing error, ignore
        }
    }

    // Deadline Date
    const deadlineElement = $job.find('.field--name-field-deadline .field__item'); // Hypothetical selector
    if (deadlineElement.length) {
        try {
            const dateText = deadlineElement.text().trim();
            const date = new Date(dateText);
            if (!isNaN(date.getTime())) {
                job.deadlineIsoString = date.toISOString();
            }
        } catch (e) {
            // Date parsing error, ignore
        }
    }

    // Salary information is typically not present on general UN job listing pages
    // and is not inferable from the provided HTML structure hints.

    // Only add the job if a clear title was found
    if (job.title) {
        result.push(job);
    }
});