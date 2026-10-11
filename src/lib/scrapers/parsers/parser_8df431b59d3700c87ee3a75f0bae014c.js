// Extract basic metadata
const sourceUrl = $('meta[property="og:url"]').attr('content') || '';
const postedDateIsoString = $('meta[property="article:published_time"]').attr('content') ||
                           $('meta[property="og:published_time"]').attr('content') || '';

// Helper to clean text
const clean = (txt) => (txt || '').trim().replace(/\s+/g, ' ');

// Find a probable job title
let title = '';
$('h1, h2, h3').each((_, el) => {
  const txt = clean($(el).text());
  if (txt && /job|vacancy|opening|engineer/i.test(txt) && !title) {
    title = txt;
  }
});
if (!title) {
  const metaTitle = $('meta[property="og:title"]').attr('content');
  title = clean(metaTitle || $('title').first().text());
}

// Locate main article/content area for description
let description = '';
let $content = $('.entry-content').first();
if (!$content.length) $content = $('article').first();
if (!$content.length) $content = $('.post-content').first();
if ($content.length) {
  description = clean($content.text());
}

// If we couldn't find a clear title or description, assume no real job posting
if (!title || !description) {
  // leave result empty
} else {
  // Attempt to extract company name
  let companyName = clean($('meta[name="author"]').attr('content'));
  if (!companyName) {
    companyName = clean($('meta[property="og:site_name"]').attr('content'));
  }

  // Attempt to extract location from description
  let location = '';
  const locMatch = description.match(/Location[:\s]+([\w\s,.-]+)/i);
  if (locMatch) location = clean(locMatch[1]);

  // Detect job type
  let jobType = '';
  const typeMap = {
    full_time: /full[-\s]?time/i,
    part_time: /part[-\s]?time/i,
    contract: /contract/i,
    internship: /internship/i,
    remote: /remote/i
  };
  for (const [type, regex] of Object.entries(typeMap)) {
    if (regex.test(description)) {
      jobType = type;
      break;
    }
  }

  // Detect salary ranges
  let salaryMin = null, salaryMax = null, salaryCurrency = null;
  const salaryMatch = description.match(/([\$€£¥])\s?([\d,.]+)\s?(?:-|\sto\s)?\s*([\$€£¥])?\s?([\d,.]+)?/);
  if (salaryMatch) {
    salaryCurrency = salaryMatch[1] || salaryMatch[3] || null;
    const min = salaryMatch[2].replace(/,/g, '');
    const max = salaryMatch[4] ? salaryMatch[4].replace(/,/g, '') : null;
    salaryMin = Number(min) || null;
    salaryMax = max ? Number(max) : salaryMin;
  }

  // Build job object
  const job = {
    title,
    companyName: companyName || undefined,
    description,
    location: location || undefined,
    jobType: jobType || undefined,
    sourceUrl: sourceUrl || undefined,
    postedDateIsoString: postedDateIsoString || undefined,
    deadlineIsoString: undefined,
    salaryMin: salaryMin !== null ? salaryMin : undefined,
    salaryMax: salaryMax !== null ? salaryMax : undefined,
    salaryCurrency: salaryCurrency || undefined
  };

  // Remove undefined keys for cleanliness
  Object.keys(job).forEach(k => job[k] === undefined && delete job[k]);

  result.push(job);
}