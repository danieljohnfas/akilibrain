var canonical = $('link[rel="canonical"]').first().attr('href') || '';
var ogUrl = $('meta[property="og:url"]').first().attr('content') || '';
var sourceUrl = canonical || ogUrl || '';
var ogTitle = $('meta[property="og:title"]').first().attr('content') || '';
var metaTitle = $('title').first().text() || '';
var title = (ogTitle || metaTitle).replace(/\s+/g, ' ').trim();
var ogDesc = $('meta[property="og:description"]').first().attr('content') || '';
var metaDesc = $('meta[name="description"]').first().attr('content') || '';
var description = (ogDesc || metaDesc).replace(/\s+/g, ' ').trim();
var publishedTime = $('meta[property="article:published_time"]').first().attr('content') || '';
var ogUpdated = $('meta[property="og:updated_time"]').first().attr('content') || '';
var postedDateIsoString = publishedTime || ogUpdated || '';
var company = '';
var schema = null;
try {
var scripts = $('script[type="application/ld+json"]');
if (scripts.length > 0) {
schema = JSON.parse(scripts.eq(0).text());
}
} catch (e) {
schema = null;
}
if (schema && schema['@graph']) {
var graph = schema['@graph'];
var found = null;
for (var i = 0; i < graph.length; i++) {
var type = graph[i]['@type'];
if (type === 'JobPosting' || type === 'BlogPosting') {
found = graph[i];
break;
}
}
if (found) {
if (!title && found['headline']) title = found['headline'];
if (!description && found['description']) description = found['description'];
if (!publishedTime && found['datePublished']) postedDateIsoString = found['datePublished'];
}
}
var keywords = /job|vacancy|hiring|position|now hiring/i;
if (keywords.test(title)) {
var companyMatch = title.match(/at\s+([\w\s&]+?)(?:\s*-\s*(?:careers?|career|jobs|board|agency|portal|recruit|news|blog)\s*)?$/i);
if (companyMatch && companyMatch[1]) {
company = companyMatch[1].trim();
} else if (sourceUrl) {
company = sourceUrl.split('://')[1].split('/')[0];
}
result.push({
title: title,
companyName: company,
description: description,
sourceUrl: sourceUrl,
postedDateIsoString: postedDateIsoString
});
}