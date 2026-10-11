var title = $('title').text().trim();
var isJob = /vacancy|job (vacancy|opening|position|hiring)/i.test(title);
if (isJob) {
    var articles = $('article');
    if (articles.length) {
        articles.each(function() {
            var $el = $(this);
            var h1 = $el.find('h1, h2').first().text().trim();
            if (!h1 || !h1.match(/vacancy|job/i)) return;
            var sourceUrl = $('link[rel="canonical"]').attr('href') || '';
            var desc = $el.find('p').map(function() { return $(this).text().trim() }).get().join(' ');
            if (!desc) desc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
            var company = h1.match(/at\s+(.+?)[,.]/i);
            company = company ? company[1].trim() : '';
            if (!company) company = $('meta[name="description"]').attr('content') || '';
            company = company.replace(/\s+is\s+.*$/i, '').trim().replace(/,\s*\(.*$/i, '').trim();
            var postDate = $('meta[property="article:published_time"]').attr('content') || $('meta[property="og:updated_time"]').attr('content');
            var location = '';
            if (title.match(/Dar es Salaam/i)) location = 'Dar es Salaam';
            result.push({
                title: h1,
                companyName: company,
                description: desc,
                location: location,
                sourceUrl: sourceUrl,
                postedDateIsoString: postDate
            });
        });
    } else {
        var sourceUrl = $('link[rel="canonical"]').attr('href') || '';
        var desc = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
        var date = $('meta[property="article:published_time"]').attr('content') || $('meta[property="og:updated_time"]').attr('content');
        var companyMatch = title.match(/Vacancy at (.+?),\s+/i);
        var company = companyMatch ? companyMatch[1].trim() : '';
        var location = title.match(/Dar es Salaam/i) ? 'Dar es Salaam' : '';
        var cleanTitle = title.replace(/\s*-\s*CAREERS\s*$/i, '').trim();
        if (cleanTitle) {
            result.push({
                title: cleanTitle,
                companyName: company,
                description: desc,
                location: location,
                sourceUrl: sourceUrl,
                postedDateIsoString: date
            });
        }
    }
}