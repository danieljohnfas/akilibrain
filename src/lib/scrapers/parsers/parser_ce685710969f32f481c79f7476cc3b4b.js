// Check if this is a job listing page or a category/directory page
// Look for actual job listings with clear job titles
const jobContainers = $('article, .job-listing, .job-item, [class*="job-listing"], [class*="job-item"], .post-type-job, .listing-item');

// If no job containers found, check for JSON-LD job data
if (jobContainers.length === 0) {
    const jsonLdScript = $('script[type="application/ld+json"]');
    if (jsonLdScript.length > 0) {
        try {
            const jsonLd = JSON.parse(jsonLdScript.html());
            if (jsonLd['@graph'] && Array.isArray(jsonLd['@graph'])) {
                jsonLd['@graph'].forEach(item => {
                    if (item['@type'] === 'JobPosting') {
                        result.push({
                            title: item.title || '',
                            companyName: item.hiring?.name || item.hiring?.organization?.name || '',
                            description: item.description || '',
                            location: item.jobLocation?.address?.addressLocality || item.jobLocation?.address?.addressRegion || '',
                            jobType: item.employmentType || '',
                            sourceUrl: item.url || '',
                            postedDateIsoString: item.datePosted || '',
                            deadlineIsoString: item.validThrough || '',
                            salaryMin: item.baseSalary?.value?.minValue || null,
                            salaryMax: item.baseSalary?.value?.maxValue || null,
                            salaryCurrency: item.baseSalary?.value?.currency || ''
                        });
                    }
                });
            }
        } catch (e) {
            // Ignore JSON parse errors
        }
    }
} else {
    // Extract from HTML job containers
    jobContainers.each(function() {
        const $this = $(this);
        
        // Look for job title in common locations
        const title = $this.find('h1, h2, h3, h4, .job-title, .title, [class*="title"], [class*="position"]').first().text().trim();
        
        // Skip if no clear job title found
        if (!title || title.length < 5) return;
        
        // Skip if this looks like a category/directory item
        if (title.toLowerCase().includes('category') || 
            title.toLowerCase().includes('tag') || 
            title.toLowerCase().includes('archive') ||
            title.toLowerCase().includes('page')) return;
            
        const companyName = $this.find('.company, .company-name, .employer, [class*="company"], [class*="employer"]').first().text().trim();
        const description = $this.find('.description, .job-description, .summary, [class*="description"]').first().text().trim();
        const location = $this.find('.location, .job-location, [class*="location"]').first().text().trim();
        const jobType = $this.find('.job-type, .type, [class*="type"], [class*="employment"]').first().text().trim();
        const sourceUrl = $this.find('a[href*="job"], a[href*="position"], a[href*="career"]').first().attr('href') || '';
        const postedDate = $this.find('.posted, .date, .post-date, [class*="date"], time').first().attr('datetime') || $this.find('.posted, .date, .post-date, [class*="date"], time').first().text().trim();
        
        result.push({
            title: title,
            companyName: companyName,
            description: description,
            location: location,
            jobType: jobType,
            sourceUrl: sourceUrl,
            postedDateIsoString: postedDate,
            deadlineIsoString: '',
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: ''
        });
    });
}