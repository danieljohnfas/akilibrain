if ($('meta[property="og:title"]').length > 0) {
    let ogTitle = $('meta[property="og:title"]').attr('content');
    let titleParts = ogTitle.split(':');
    let title = titleParts[0].trim();
    let companyAndLocation = titleParts.length > 1 ? titleParts[1].trim() : '';
    let companyName = '';
    let location = '';
    if (companyAndLocation) {
        let parts = companyAndLocation.split(' in ');
        companyName = parts[0].trim();
        location = parts.length > 1 ? parts[1].trim() : '';
    }
    let description = $('meta[name="description"]').attr('content') || '';
    let jobType = '';
    let titleText = $('title').text();
    if (titleText.includes('Full-Time') || titleText.includes('Full Time')) {
        jobType = 'full_time';
    } else if (titleText.includes('Part-Time') || titleText.includes('Part Time')) {
        jobType = 'part_time';
    } else if (titleText.includes('Contract')) {
        jobType = 'contract';
    } else if (titleText.includes('Internship')) {
        jobType = 'internship';
    } else if (titleText.includes('Remote')) {
        jobType = 'remote';
    }
    let sourceUrl = $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content') || '';
    let job = {
        title: title,
        companyName: companyName,
        description: description,
        location: location,
        jobType: jobType,
        sourceUrl: sourceUrl
    };
    result.push(job);
}