var rawJobTitle = $('meta[property="og:title"]').last().attr('content');
var jobTitle = rawJobTitle ? $('<div>').html(rawJobTitle).text() : null;
var sourceUrl = $('meta[property="og:url"][content*="/job-position/"]').attr('content');

if (jobTitle && sourceUrl) {
    result.push({
        title: jobTitle.trim(),
        companyName: null,
        description: null,
        location: null,
        jobType: null,
        sourceUrl: sourceUrl,
        postedDateIsoString: null,
        deadlineIsoString: null,
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null
    });
}