var titleEl = $('title');
var fullTitle = titleEl.text().trim();
if (fullTitle) {
    var cleanTitle = fullTitle.replace(/\s*\|\s*Dr\. Job\s*$/, '');
    var match = cleanTitle.match(/^(.*?)\s+Jobs in\s+(.*?)\s+in\s+(.*)$/);
    if (match) {
        var title = match[1].trim();
        var company = match[2].trim();
        var location = match[3].trim();
        var descEl = $('meta[name="description"]');
        var description = descEl.length ? descEl.attr('content').trim() : '';
        var canonEl = $('link[rel="canonical"]');
        var sourceUrl = canonEl.length ? canonEl.attr('href').trim() : '';
        if (title && company) {
            result.push({
                title: title,
                companyName: company,
                description: description,
                location: location,
                sourceUrl: sourceUrl
            });
        }
    }
}