var jobContainers = $('article, div.job, .job-listing, .posting');
jobContainers.each(function() {
    var $job = $(this);
    var titleEl = $job.find('h2, h3, h4, .title, .job-title');
    if (!titleEl.length) return;
    
    var title = titleEl.text().trim();
    if (!title) return;

    var companyEl = $job.find('.company, .org, .name');
    var company = companyEl.first().text().trim();

    var descEl = $job.find('.description, .summary, p');
    var description = descEl.first().text().trim();

    var locEl = $job.find('.location, .city, .place');
    var location = locEl.text().trim();

    var typeEl = $job.find('.type, .employment, .role');
    var jobType = typeEl.text().trim();

    var linkEl = $job.find('a[href]');
    var sourceUrl = linkEl ? linkEl.attr('href') : '';

    result.push({
        title: title,
        companyName: company,
        description: description,
        location: location,
        jobType: jobType,
        sourceUrl: sourceUrl,
        postedDateIsoString: '',
        deadlineIsoString: '',
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: ''
    });
});