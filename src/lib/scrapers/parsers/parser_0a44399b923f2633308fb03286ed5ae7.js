var rawTitle = $('title').text().trim();
var canonical = $('link[rel="canonical"]').attr('href');
var metaDesc = $('meta[name="description"]').attr('content');
var metaSection = $('meta[property="article:section"]').attr('content');
var pubDate = $('meta[property="article:published_time"]').attr('content');
var modDate = $('meta[property="article:modified_time"]').attr('content');
var ogUrl = $('meta[property="og:url"]').attr('content');

var hasJobIndicator = rawTitle.indexOf(' at ') !== -1;
var hasDescription = metaDesc && metaDesc.length > 20;
var isOpportunitiesSection = metaSection && metaSection.toLowerCase().indexOf('opportunity') !== -1;

if (hasJobIndicator && hasDescription) {
    var title = rawTitle;
    var company = '';
    var parts = rawTitle.split(' at ');
    if (parts.length > 1) {
        title = parts[0].trim();
        var rest = parts[1];
        rest = rest.replace(/\s+(20\d{2}|January|February|March|April|May|June|July|August|September|October|November|December)\s*$/, '').trim();
        company = rest;
    }
    result.push({
        title: title,
        companyName: company,
        description: metaDesc,
        sourceUrl: canonical || ogUrl || '',
        postedDateIsoString: pubDate || modDate || ''
    });
}
result = result;
if (typeof result !== 'object') {
    var result = [];
}