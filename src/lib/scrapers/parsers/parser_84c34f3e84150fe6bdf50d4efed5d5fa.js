var jobContainers = $('.job-listing, .job-card, .job-item, .listing-card');

if (jobContainers.length === 0) {
    // The provided HTML does not contain typical job listing structures.
    // As per instruction #2, if it does NOT contain real job postings,
    // the result array MUST be left empty.
    // The given HTML sample is a Cloudflare Turnstile challenge page, not a job board.
    // Thus, nothing is pushed to the result array.
} else {
    jobContainers.each((i, el) => {
        var job = $(el);
        var title = job.find('.job-title, h2, h3').first().text().trim();
        var companyName = job.find('.company-name, .company, .employer').first().text().trim();
        var description = job.find('.job-description, .description-text').first().text().trim();
        var location = job.find('.job-location, .location').first().text().trim();
        var jobType = job.find('.job-type, .type').first().text().toLowerCase().trim();
        var sourceUrl = job.find('.job-title a').attr('href') || null;
        var postedDateIsoString = job.find('.posted-date, .date-posted').attr('datetime') || job.find('.posted-date, .date-posted').text().trim();
        var deadlineIsoString = job.find('.deadline, .apply-by').attr('datetime') || job.find('.deadline, .apply-by').text().trim();
        var salaryMinText = job.find('.salary-min, .salary-range span:first-child').text().replace(/[^0-9.]/g, '');
        var salaryMaxText = job.find('.salary-max, .salary-range span:last-child').text().replace(/[^0-9.]/g, '');
        var salaryCurrency = job.find('.salary-currency, .salary-range').text().replace(/[^A-Za-z$€£]/g, '').trim().toUpperCase();

        var salaryMin = parseFloat(salaryMinText) || null;
        var salaryMax = parseFloat(salaryMaxText) || null;

        // Basic normalization for jobType
        if (jobType.includes('full-time')) jobType = 'full_time';
        else if (jobType.includes('part-time')) jobType = 'part_time';
        else if (jobType.includes('contract')) jobType = 'contract';
        else if (jobType.includes('internship')) jobType = 'internship';
        else if (jobType.includes('remote')) jobType = 'remote';
        else jobType = null;

        // Ensure a clear job title exists
        if (title) {
            result.push({
                title: title,
                companyName: companyName || null,
                description: description || null,
                location: location || null,
                jobType: jobType,
                sourceUrl: sourceUrl,
                postedDateIsoString: postedDateIsoString || null,
                deadlineIsoString: deadlineIsoString || null,
                salaryMin: salaryMin,
                salaryMax: salaryMax,
                salaryCurrency: salaryCurrency || null
            });
        }
    });
}