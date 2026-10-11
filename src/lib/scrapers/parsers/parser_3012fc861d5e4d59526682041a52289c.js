var job = {};

var ogTitle = $('meta[property="og:title"]').attr('content');
var metaDescription = $('meta[name="description"]').attr('content');
var canonicalUrl = $('link[rel="canonical"]').attr('href');

if (ogTitle && canonicalUrl && canonicalUrl.includes('/jobs/')) {
    job.sourceUrl = canonicalUrl;

    var titleAtSplit = ogTitle.split(' - at ');
    if (titleAtSplit.length > 1) {
        job.title = titleAtSplit[0].trim();
        var companyLocationPart = titleAtSplit[1].trim();
        var lastDashIndex = companyLocationPart.lastIndexOf(' - ');
        if (lastDashIndex !== -1) {
            job.companyName = companyLocationPart.substring(0, lastDashIndex).trim();
            job.location = companyLocationPart.substring(lastDashIndex + 3).trim();
        } else {
            job.companyName = companyLocationPart;
        }
    } else {
        var simpleTitleSplit = ogTitle.split(' - ');
        if (simpleTitleSplit.length > 0) {
            job.title = simpleTitleSplit[0].trim();
            if (simpleTitleSplit.length > 1) {
                job.location = simpleTitleSplit[simpleTitleSplit.length - 1].trim();
            }
        } else {
            job.title = ogTitle.trim();
        }
    }

    if (metaDescription) {
        var deadlineMatch = metaDescription.match(/Mwisho:\s*(\d{4}-\d{2}-\d{2})/i);
        if (deadlineMatch && deadlineMatch[1]) {
            try {
                var date = new Date(deadlineMatch[1]);
                if (!isNaN(date.getTime())) {
                    job.deadlineIsoString = date.toISOString().split('T')[0];
                }
            } catch (e) {
                // Date parsing failed, deadlineIsoString remains unset
            }
        }
        job.description = metaDescription.trim();
    }

    result.push(job);
}