const ogTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
let title = null, companyName = null;
if (ogTitle) {
  const m = ogTitle.match(/^(.+?)\s+Job\s+Opportunity\s+at\s+(.+?)(?:\s*\|.*)?$/i);
  if (m) {
    title = m[1].trim();
    companyName = m[2].trim();
  } else {
    title = ogTitle;
  }
}
const description = $('meta[name="description"]').attr('content') || $('article').text().trim() || $('.entry-content').text().trim() || '';
let location = null;
if (description) {
  const locMatch = description.match(/Location[:\s]+([^\n\r]+)/i);
  if (locMatch) location = locMatch[1].trim();
}
const sourceUrl = $('meta[property="og:url"]').attr('content') || '';
const postedDateIsoString = $('meta[property="article:published_time"]').attr('content') || '';
const job = {};
if (title) job.title = title;
if (companyName) job.companyName = companyName;
if (description) job.description = description;
if (location) job.location = location;
if (sourceUrl) job.sourceUrl = sourceUrl;
if (postedDateIsoString) job.postedDateIsoString = postedDateIsoString;
if (Object.keys(job).length) result.push(job);