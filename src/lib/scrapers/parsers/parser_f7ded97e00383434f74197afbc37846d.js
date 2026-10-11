const jobContainers = $('.entry-content .job-listing, article.post, div.job-item, .listing-item');

if (jobContainers.length > 0) {
    jobContainers.each((index, element) => {
        const job = {};
        const $element = $(element);

        job.title = $element.find('h2.job-title, h3.entry-title, .job-title a, .entry-title a').first().text().trim();

        job.companyName = $element.find('.company-name, .job-company, .listing-company').first().text().trim();

        job.description = $element.find('.job-description, .entry-summary, p.description, .listing-description').first().text().trim();

        job.location = $element.find('.job-location, .location, .listing-location').first().text().trim();

        let jobTypeRaw = $element.find('.job-type, .type, .listing-type').first().text().toLowerCase();
        if (jobTypeRaw.includes('full-time') || jobTypeRaw.includes('full time')) {
            job.jobType = 'full_time';
        } else if (jobTypeRaw.includes('part-time') || jobTypeRaw.includes('part time')) {
            job.jobType = 'part_time';
        } else if (jobTypeRaw.includes('contract')) {
            job.jobType = 'contract';
        } else if (jobTypeRaw.includes('internship')) {
            job.jobType = 'internship';
        } else if (jobTypeRaw.includes('remote')) {
            job.jobType = 'remote';
        }

        job.sourceUrl = $element.find('h2.job-title a, h3.entry-title a, .listing-title a').first().attr('href');

        const postedDateText = $element.find('.posted-date, .date-posted, time.entry-date, .listing-date').first().attr('datetime') || $element.find('.posted-date, .date-posted, time.entry-date, .listing-date').first().text();
        try {
            if (postedDateText) {
                const date = new Date(postedDateText);
                if (!isNaN(date.getTime())) {
                    job.postedDateIsoString = date.toISOString();
                }
            }
        } catch (e) {
            // Ignore parsing errors
        }

        // salaryMin, salaryMax, salaryCurrency, deadlineIsoString are often not on list pages or require complex parsing
        // and are not clearly present in a generic job list structure example.
        // Leaving them undefined as per instructions if not available.

        if (job.title) {
            result.push(job);
        }
    });
}