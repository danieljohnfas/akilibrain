const jobElements = $('a[href*="job"]', 'div.job', 'li.job', 'article.posting');
jobElements.forEach(function(element) {
    var title = $(element).find('h2, h3, h4').first().text().trim();
    if (!title) return;
    var company = $(element).find('span[class*="company"]').text().trim();
    var description = $(element).find('p').text().trim();
    var location = $(element).find('span[class*="location"]').text().trim();
    var jobType = $(element).find('span[class*="type"]').text().trim();
    var sourceUrl = $(element).attr('href') || '';
    var postedDateIsoString = $(element).attr('data-date') || $(element).find('time').attr('datetime') || '';
    var deadlineIsoString = $(element).attr('data-deadline') || '';
    var salaryMin = $('.salary-min').text().trim();
    var salaryMax = $('.salary-max').text().trim();
    var salaryCurrency = $('.currency').text().trim();
    var job = {
        title: title,
        companyName: company,
        description: description,
        location: location,
        jobType: jobType,
        sourceUrl: sourceUrl,
        postedDateIsoString: postedDateIsoString,
        deadlineIsoString: deadlineIsoString,
        salaryMin: salaryMin === '' ? null : Number(salaryMin),
        salaryMax: salaryMax === '' ? null : Number(salaryMax),
        salaryCurrency: salaryCurrency
    };
    result.push(job);
});