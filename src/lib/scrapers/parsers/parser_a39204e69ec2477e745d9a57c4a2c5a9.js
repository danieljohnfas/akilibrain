// Extract job listings from the HTML
const jobs = [];

// Look for job listing containers - try multiple selectors
const jobSelectors = [
    '.job-listing',
    '.vacancy',
    '.job-item',
    '.listing',
    '[class*="job"]',
    '[class*="vacancy"]',
    'article',
    '.post',
    '.entry'
];

let foundJobs = false;

// Try to find job listings by looking for repeating patterns
$('h1, h2, h3, h4').each(function(i, el) {
    const $el = $(el);
    const title = $el.text().trim();
    
    // Skip if title doesn't look like a job title
    if (!title || title.length < 10) return;
    if (title.toLowerCase().includes('stanbic bank') || 
        title.toLowerCase().includes('bank') ||
        title.toLowerCase().includes('manager') ||
        title.toLowerCase().includes('officer') ||
        title.toLowerCase().includes('analyst') ||
        title.toLowerCase().includes('specialist') ||
        title.toLowerCase().includes('director') ||
        title.toLowerCase().includes('supervisor')) {
        
        // Look for container element
        const $container = $el.closest('article, .post, .entry, .job, .vacancy, .listing, [class*="job"], [class*="vacancy"]');
        if ($container.length === 0) return;
        
        // Extract job details
        const description = $container.find('p').first().text().trim();
        const location = $container.find('.location, .job-location, [class*="location"]').first().text().trim();
        const jobType = $container.find('.job-type, .type, [class*="type"]').first().text().trim();
        const sourceUrl = $container.find('a').first().attr('href') || '';
        const postedDate = $container.find('.date, .posted, [class*="date"]').first().text().trim();
        const deadline = $container.find('.deadline, .closing, [class*="deadline"]').first().text().trim();
        const salary = $container.find('.salary, .pay, [class*="salary"]').first().text().trim();
        
        // Parse salary if available
        let salaryMin, salaryMax, salaryCurrency;
        if (salary) {
            const salaryMatch = salary.match(/(\d+)[\s,]*(\d+)*/);
            if (salaryMatch) {
                salaryMin = parseInt(salaryMatch[1]);
                if (salaryMatch[2]) salaryMax = parseInt(salaryMatch[2]);
            }
            if (salary.toLowerCase().includes('tzs') || salary.includes('TZS')) {
                salaryCurrency = 'TZS';
            } else if (salary.includes('$')) {
                salaryCurrency = 'USD';
            }
        }
        
        // Determine job type
        let jobTypeNormalized = '';
        const titleLower = title.toLowerCase();
        if (titleLower.includes('full time') || titleLower.includes('full-time')) {
            jobTypeNormalized = 'full_time';
        } else if (titleLower.includes('part time') || titleLower.includes('part-time')) {
            jobTypeNormalized = 'part_time';
        } else if (titleLower.includes('contract')) {
            jobTypeNormalized = 'contract';
        } else if (titleLower.includes('intern')) {
            jobTypeNormalized = 'internship';
        } else if (titleLower.includes('remote')) {
            jobTypeNormalized = 'remote';
        }
        
        const job = {
            title: title,
            companyName: 'Stanbic Bank Tanzania',
            description: description,
            location: location,
            jobType: jobTypeNormalized,
            sourceUrl: sourceUrl,
            postedDateIsoString: postedDate,
            deadlineIsoString: deadline,
            salaryMin: salaryMin,
            salaryMax: salaryMax,
            salaryCurrency: salaryCurrency
        };
        
        jobs.push(job);
        foundJobs = true;
    }
});

// If no jobs found with headings, try other selectors
if (!foundJobs) {
    $(jobSelectors.join(',')).each(function(i, el) {
        const $el = $(el);
        const title = $el.find('h1, h2, h3, h4, .title, [class*="title"]').first().text().trim();
        
        if (title && title.length > 5) {
            const description = $el.find('p').first().text().trim();
            const location = $el.find('.location, [class*="location"]').first().text().trim();
            const jobType = $el.find('.job-type, [class*="type"]').first().text().trim();
            const sourceUrl = $el.find('a').first().attr('href') || '';
            
            const job = {
                title: title,
                companyName: 'Stanbic Bank Tanzania',
                description: description,
                location: location,
                jobType: jobType,
                sourceUrl: sourceUrl,
                postedDateIsoString: '',
                deadlineIsoString: '',
                salaryMin: null,
                salaryMax: null,
                salaryCurrency: ''
            };
            
            jobs.push(job);
            foundJobs = true;
        }
    });
}

// Push results to the global result array
result.push(...jobs);