// Check if this is a job posting page by looking for job-related content
const jobContainer = $('.entry-content, .job-description, .post-content');
const hasJobTitle = $('title').text().toLowerCase().includes('job') || 
                   $('title').text().toLowerCase().includes('career') ||
                   $('title').text().toLowerCase().includes('vacancy');

// Only proceed if this appears to be a job posting
if (hasJobTitle && jobContainer.length > 0) {
    // Extract job title from page title or heading
    let title = $('title').text().split(' - ')[0].trim();
    
    // Clean up title - remove common suffixes
    title = title.replace(/\s*-\s*Angazetu\s*$/i, '').trim();
    
    // Extract company name - look for patterns like "at [Company]" in title
    let companyName = '';
    const companyMatch = title.match(/\bat\s+(.+?)$/i);
    if (companyMatch) {
        companyName = companyMatch[1].trim();
        // Remove the company part from title to get clean job title
        title = title.replace(/\s+at\s+.+$/i, '').trim();
    }
    
    // Extract source URL from canonical link or og:url
    const sourceUrl = $('link[rel="canonical"]').attr('href') || 
                     $('meta[property="og:url"]').attr('content') || 
                     window.location.href;
    
    // Extract description from meta tags or content
    const description = $('meta[name="description"]').attr('content') || 
                       $('.entry-content p').first().text().trim() ||
                       $('meta[property="og:description"]').attr('content');
    
    // Extract location if available
    const location = $('.job-location, .location, [class*="location"]').first().text().trim() || '';
    
    // Extract job type if available
    const jobTypeText = $('.job-type, .type, [class*="type"]').first().text().toLowerCase();
    let jobType = '';
    if (jobTypeText.includes('full') || jobTypeText.includes('permanent')) jobType = 'full_time';
    else if (jobTypeText.includes('part')) jobType = 'part_time';
    else if (jobTypeText.includes('contract')) jobType = 'contract';
    else if (jobTypeText.includes('intern')) jobType = 'internship';
    else if (jobTypeText.includes('remote')) jobType = 'remote';
    
    // Extract dates if available
    const postedDate = $('.posted-date, .date, [class*="date"]').first().text().trim();
    const deadline = $('.deadline, .closing-date, [class*="deadline"]').first().text().trim();
    
    // Extract salary if available
    const salaryText = $('.salary, .pay, [class*="salary"]').first().text();
    let salaryMin = null, salaryMax = null, salaryCurrency = '';
    if (salaryText) {
        const salaryMatch = salaryText.match(/([\d,]+)\s*-\s*([\d,]+)/);
        if (salaryMatch) {
            salaryMin = parseInt(salaryMatch[1].replace(/,/g, ''));
            salaryMax = parseInt(salaryMatch[2].replace(/,/g, ''));
        }
        if (salaryText.includes('TZS') || salaryText.includes('TSh')) salaryCurrency = 'TZS';
        else if (salaryText.includes('USD')) salaryCurrency = 'USD';
    }
    
    // Create job object
    const job = {
        title: title || $('title').text().split(' - ')[0].trim(),
        companyName: companyName || 'Company not specified',
        description: description || '',
        location: location || '',
        jobType: jobType || '',
        sourceUrl: sourceUrl,
        postedDateIsoString: postedDate || '',
        deadlineIsoString: deadline || '',
        salaryMin: salaryMin,
        salaryMax: salaryMax,
        salaryCurrency: salaryCurrency
    };
    
    // Only push if we have a meaningful title
    if (job.title && job.title.length > 5) {
        result.push(job);
    }
}