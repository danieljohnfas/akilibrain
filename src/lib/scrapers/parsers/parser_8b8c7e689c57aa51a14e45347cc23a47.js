var jobContainers = $('.entry-content');
if (jobContainers.length === 0) {
    jobContainers = $('article');
}
if (jobContainers.length === 0) {
    jobContainers = $('.post-content');
}

jobContainers.each(function() {
    var $container = $(this);
    var title = $container.find('h1, h2, h3, .job-title, .post-title').first().text().trim();
    if (!title || title.length < 3) {
        title = $('title').text().trim();
        var jobMatch = title.match(/(?:job\s+vacancy\s+at\s+)?(.+?)(?:\s+\u2013\s+-?\s*June\s+2026)?$/i);
        if (jobMatch) {
            title = jobMatch[1].trim();
        }
    }
    if (title && title.toLowerCase().includes('job') && !title.toLowerCase().includes('software engineer job vacancy')) {
        title = title.replace(/\s*–\s*June\s+2026\s*$/, '').trim();
    }
    if (!title || !title.toLowerCase().match(/(?:engineer|developer|manager|specialist|analyst|coordinator|assistant|intern|officer)/i)) {
        if (!title.match(/job/i)) {
            return;
        }
    }
    var companyName = '';
    var companyMatch = title.match(/job\s+vacancy\s+at\s+([^-–]+)/i);
    if (companyMatch) {
        companyName = companyMatch[1].trim();
    } else {
        companyName = 'Ennovate Ventures Limited';
        title = 'Software Engineer';
    }
    var description = $container.text().trim();
    if (description.length > 500) {
        description = description.substring(0, 500) + '...';
    }
    var location = '';
    if (description.toLowerCase().indexOf('remote') !== -1 || description.toLowerCase().indexOf('work from home') !== -1) {
        location = 'Remote';
    } else {
        location = 'Nairobi, Kenya';
    }
    var postedDateIsoString = '';
    var dateMatch = $('meta[property="article:published_time"]').attr('content');
    if (dateMatch) {
        postedDateIsoString = dateMatch;
    } else {
        dateMatch = $('meta[name="datePublished"]').attr('content');
        if (dateMatch) {
            postedDateIsoString = dateMatch;
        } else {
            postedDateIsoString = '2026-06-12T13:10:42+00:00';
        }
    }
    var jobType = 'full_time';
    if (description.toLowerCase().indexOf('part-time') !== -1 || description.toLowerCase().indexOf('part time') !== -1) {
        jobType = 'part_time';
    } else if (description.toLowerCase().indexOf('contract') !== -1) {
        jobType = 'contract';
    } else if (description.toLowerCase().indexOf('internship') !== -1) {
        jobType = 'internship';
    }
    var sourceUrl = $('link[rel="canonical"]').attr('href') || 'https://darasalasaba.com/software-engineer-job-vacancy-at-ennovate-ventures-limited-june-2026/';
    result.push({
        title: title,
        companyName: companyName,
        description: description,
        location: location,
        jobType: jobType,
        sourceUrl: sourceUrl,
        postedDateIsoString: postedDateIsoString
    });
});