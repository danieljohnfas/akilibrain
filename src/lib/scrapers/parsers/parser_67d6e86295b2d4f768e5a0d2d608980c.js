// Check if the page contains actual job listings
const jobContainers = $('.job-card, .job-listing, [class*="job"], [class*="position"]');
if (jobContainers.length === 0) {
    // No job listings found, leave result empty
} else {
    jobContainers.each(function(i, elem) {
        const $elem = $(elem);
        
        // Skip if this doesn't look like a real job listing
        const title = $elem.find('h1, h2, h3, .title, [class*="title"]').first().text().trim();
        if (!title || title.length < 5) return;
        
        const company = $elem.find('.company, .employer, [class*="company"], [class*="employer"]').first().text().trim();
        const location = $elem.find('.location, [class*="location"]').first().text().trim();
        const description = $elem.find('.description, .summary, [class*="description"]').first().text().trim();
        
        // Extract job type
        let jobType = '';
        const jobTypeText = $elem.find('[class*="type"], [class*="employment"]').first().text().toLowerCase();
        if (jobTypeText.includes('full') || jobTypeText.includes('permanent')) jobType = 'full_time';
        else if (jobTypeText.includes('part')) jobType = 'part_time';
        else if (jobTypeText.includes('contract')) jobType = 'contract';
        else if (jobTypeText.includes('intern')) jobType = 'internship';
        else if (jobTypeText.includes('remote') || jobTypeText.includes('home')) jobType = 'remote';
        
        // Extract URL
        const link = $elem.find('a[href*="/jobs/"], a[href*="/job/"]').first();
        const sourceUrl = link.attr('href') ? link.attr('href').split('?')[0] : '';
        
        // Extract dates
        const postedDate = $elem.find('[class*="posted"], [class*="date"], time').first().attr('datetime') || 
                          $elem.find('[class*="posted"], [class*="date"], time').first().text().trim();
        
        // Extract salary
        const salaryText = $elem.find('[class*="salary"], [class*="pay"]').first().text();
        let salaryMin = null, salaryMax = null, salaryCurrency = '';
        if (salaryText) {
            const salaryMatch = salaryText.match(/(\d+)[\s,-]*(\d+)?/);
            if (salaryMatch) {
                salaryMin = parseInt(salaryMatch[1]);
                if (salaryMatch[2]) salaryMax = parseInt(salaryMatch[2]);
            }
            if (salaryText.includes('TZS') || salaryText.includes('Sh')) salaryCurrency = 'TZS';
            else if (salaryText.includes('USD') || salaryText.includes('$')) salaryCurrency = 'USD';
        }
        
        result.push({
            title: title,
            companyName: company || '',
            description: description || '',
            location: location || '',
            jobType: jobType || '',
            sourceUrl: sourceUrl || '',
            postedDateIsoString: postedDate || '',
            deadlineIsoString: '',
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            salaryCurrency: salaryCurrency
        });
    });
}