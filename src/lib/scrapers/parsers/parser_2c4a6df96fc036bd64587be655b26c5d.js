// Extract title
let title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
if (!title) title = $('h1').first().text().trim();

// Extract company name (author meta as fallback)
let company = $('meta[name="author"]').attr('content')?.trim() || '';

// Extract source URL
let sourceUrl = $('meta[property="og:url"]').attr('content') || $('link[rel="canonical"]').attr('href') || '';

// Extract description from typical article containers
let descContainer = $('article').first();
if (!descContainer.length) descContainer = $('.post-body').first();
if (!descContainer.length) descContainer = $('.entry-content').first();
if (!descContainer.length) descContainer = $('#content').first();
let description = descContainer.text().trim();

// Helper to clean extracted strings
const clean = s => s && typeof s === 'string' ? s.replace(/\s+/g, ' ').trim() : '';

// Build job object if a clear title is present
if (title) {
    let job = {
        title: clean(title)
    };
    if (company) job.companyName = clean(company);
    if (description) job.description = clean(description);
    if (sourceUrl) job.sourceUrl = sourceUrl;

    // Location detection
    let locMatch = description.match(/Location[:\s]*([A-Za-z0-9 ,\-\(\)]+)/i);
    if (locMatch) job.location = clean(locMatch[1]);

    // Job type detection
    const typeMap = {
        full_time: /full[-\s]?time/i,
        part_time: /part[-\s]?time/i,
        contract: /\bcontract\b/i,
        internship: /\binternship\b/i,
        remote: /\bremote\b/i
    };
    for (let [type, regex] of Object.entries(typeMap)) {
        if (regex.test(description)) {
            job.jobType = type;
            break;
        }
    }

    // Posted date detection
    let posted = $('meta[property="article:published_time"]').attr('content');
    if (!posted) {
        let dateMatch = html.match(/(?:Posted|Published)\s*[:\-]\s*([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4})/i);
        if (dateMatch) posted = dateMatch[1];
    }
    if (posted) {
        let iso = new Date(posted).toISOString();
        if (!isNaN(Date.parse(iso))) job.postedDateIsoString = iso;
    }

    // Deadline detection
    let deadlineMatch = description.match(/deadline[:\s]*([A-Za-z]{3,9}\s+\d{1,2},?\s*\d{4})/i);
    if (deadlineMatch) {
        let iso = new Date(deadlineMatch[1]).toISOString();
        if (!isNaN(Date.parse(iso))) job.deadlineIsoString = iso;
    }

    // Salary detection (currency + numbers)
    let salaryMatch = description.match(/(?:salary|pay|compensation)[:\s]*([A-Z]{3}|\$|£|€)?\s?([\d,]+)(?:\s?[-–]\s?([A-Z]{3}|\$|£|€)?\s?([\d,]+))?/i);
    if (salaryMatch) {
        let cur = salaryMatch[1] || salaryMatch[3] || '';
        let min = salaryMatch[2].replace(/,/g, '');
        let max = salaryMatch[4] ? salaryMatch[4].replace(/,/g, '') : null;
        if (cur) job.salaryCurrency = cur.trim();
        if (!isNaN(min)) job.salaryMin = Number(min);
        if (max && !isNaN(max)) job.salaryMax = Number(max);
    }

    result.push(job);
}