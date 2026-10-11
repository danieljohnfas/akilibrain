var jobContainers = $('h2, .job, .posting, .listing, .job-item, article');
jobContainers.each(function() {
    var $container = $(this);
    var title = $container.text().trim();
    if (title && /\w+ Job\b/.test(title)) {
        var jobObj = {
            title: title,
            companyName: '',
            description: '',
            location: '',
            jobType: '',
            sourceUrl: '',
            postedDateIsoString: '',
            deadlineIsoString: '',
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: ''
        };
        result.push(jobObj);
    }
});