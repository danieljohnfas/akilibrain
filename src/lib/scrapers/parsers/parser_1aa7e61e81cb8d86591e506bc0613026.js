const job = {};

// Extract title from og:title meta tag
const ogTitle = $('meta[property="og:title"]').attr('content');
if (ogTitle) job.title = ogTitle.trim();

// Extract company name from title tag
const titleTag = $('title').text();
const companyMatch = titleTag.match(/at\s+([^,|]+)/);
if (companyMatch) job.companyName = companyMatch[1].trim();

// Extract location from title tag
const locationMatch = titleTag.match(/,\s*([^,|]+)\s*\|/);
if (locationMatch) job.location = locationMatch[1].trim();

// Extract source URL from canonical link
const canonical = $('link[rel="canonical"]').attr('href');
if (canonical) job.sourceUrl = canonical.trim();

// Extract posted date from article:modified_time or schema datePublished
const modifiedTime = $('meta[property="article:modified_time"]').attr('content');
if (modifiedTime) job.postedDateIsoString = modifiedTime.trim();

// Extract description from og:description
const ogDesc = $('meta[property="og:description"]').attr('content');
if (ogDesc) job.description = ogDesc.trim();

// Set job type based on typical Tanzanian job postings (not explicitly in HTML)
job.jobType = 'full_time';

// Try to extract salary from schema or meta (not present in provided HTML)
// Salary fields will remain undefined

// Only push if we have a valid title
if (job.title) {
    result.push(job);
}