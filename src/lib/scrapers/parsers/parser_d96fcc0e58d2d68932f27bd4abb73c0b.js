var jobContainers = $('.entry-content .elementor-text-editor.elementor-clearfix');

if (jobContainers.length === 0) {
    // Check for another common pattern for job listings if the first one doesn't yield results
    jobContainers = $('.job-listing, .career-item, .post.type-job_listing, .job_application_form_job_listing');
}

// Based on the provided HTML sample, which is only a <head> section
// and does not contain any actual job postings, the result array should remain empty.
// The code below is a generic structure for extracting jobs, but it will not find
// anything in the *current* HTML sample provided because there are no job elements.
// If the HTML was to contain actual job listings, this structure would be used.

// For the given HTML sample, jobContainers will be empty.
if (jobContainers.length > 0) {
    jobContainers.each(function() {
        var $job = $(this);
        var title = $job.find('h2, h3, .job-title, .career-title').first().text().trim();
        var companyName = 'St. Augustine University of Tanzania (SAUT)'; // Assuming from the context, if not found on the job card
        var description = $job.find('.job-description, .entry-content p, .elementor-widget-text-editor').first().text().trim();
        var location = $job.find('.job-location, .location-text, .fa-map-marker-alt').first().text().trim();
        var jobType = ''; // Cannot determine from the given HTML
        var sourceUrl = $job.find('a.button, a.job-link').attr('href') || window.location.href; // Fallback to current page URL

        // Attempt to find date information, though not present in sample
        var postedDateText = $job.find('.posted-date, .date-posted').first().text().trim();
        var postedDateIsoString = '';
        if (postedDateText) {
            try {
                // Simple date parsing example, adjust as needed
                var date = new Date(postedDateText);
                if (!isNaN(date.getTime())) {
                    postedDateIsoString = date.toISOString();
                }
            } catch (e) { /* ignore */ }
        }

        // Salaries, if available, would require more specific selectors
        var salaryMin = null;
        var salaryMax = null;
        var salaryCurrency = '';

        if (title) { // Only add if a clear job title is found
            result.push({
                title: title,
                companyName: companyName,
                description: description,
                location: location,
                jobType: jobType,
                sourceUrl: sourceUrl,
                postedDateIsoString: postedDateIsoString,
                deadlineIsoString: '',
                salaryMin: salaryMin,
                salaryMax: salaryMax,
                salaryCurrency: salaryCurrency
            });
        }
    });
}
// If jobContainers is empty, result remains an empty array as per instruction #2.
// The provided HTML does not contain job postings.