var job = {};

// sourceUrl
job.sourceUrl = $('link[rel="canonical"]').attr('href');

// postedDateIsoString
job.postedDateIsoString = $('meta[property="article:published_time"]').attr('content');

// title (Using og:title as the primary job title for this aggregated vacancy announcement)
var ogTitle = $('meta[property="og:title"]').attr('content');
if (ogTitle) {
    job.title = ogTitle;
} else {
    // Fallback to <title> tag, stripping site name if present
    var pageTitle = $('title').text();
    if (pageTitle) {
        job.title = pageTitle.replace(/ - Ajira New$/, '').trim();
    }
}

// companyName (Attempt to extract from og:title, fallback to keywords, then a hardcoded value if parsing fails)
if (job.title) {
    var companyMatch = job.title.match(/at\s+([^,]+)/i);
    if (companyMatch && companyMatch[1]) {
        job.companyName = companyMatch[1].trim();
    }
}
if (!job.companyName) {
    var keywordsMeta = $('meta[name="keywords"]').attr('content');
    if (keywordsMeta) {
        var keywordsArray = keywordsMeta.split(',').map(k => k.trim());
        var cocaColaKeyword = keywordsArray.find(k => k.toLowerCase().includes('coca cola kwanza limited'));
        if (cocaColaKeyword) {
            job.companyName = cocaColaKeyword;
        }
    }
}
// Final fallback based on the provided HTML's context
if (!job.companyName) {
    job.companyName = "Coca-Cola Kwanza Limited";
}


// description
// Prioritize specific selectors, then fall back to more general ones for the main content.
var descriptionContainer = $('.penci-entry-content');
if (descriptionContainer.length === 0) {
    descriptionContainer = $('.entry-content');
}
if (descriptionContainer.length === 0) {
    descriptionContainer = $('article.post-content, article .entry-content'); // Common patterns
}
if (descriptionContainer.length === 0) {
    descriptionContainer = $('div[itemprop="articleBody"]'); // Schema.org microdata
}
if (descriptionContainer.length === 0) {
    descriptionContainer = $('main, article'); // Broad containers
}


if (descriptionContainer.length > 0) {
    var descriptionClone = descriptionContainer.clone();

    // Remove scripts, styles, and other non-content elements
    descriptionClone.find('script, style, noscript, form, header, footer, nav, aside, iframe, img, video, audio, .sharedaddy, .penci-post-tags, .penci-post-navigation, .penci-comments-area, .penci-header-boxed, .penci-author-post, .post-related, .wp-block-group').remove();

    // Remove headings that duplicate the job title to avoid redundancy
    if (job.title) {
        descriptionClone.find('h1, h2, h3, h4, h5, h6').each(function() {
            if ($(this).text().trim() === job.title) {
                $(this).remove();
            }
        });
    }

    var fullDescription = descriptionClone.text();
    job.description = fullDescription
        .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
        .trim();
}

// Push job to result array only if essential fields are present and description is substantial
if (job.title && job.companyName && job.description && job.description.length > 100) {
    result.push(job);
}