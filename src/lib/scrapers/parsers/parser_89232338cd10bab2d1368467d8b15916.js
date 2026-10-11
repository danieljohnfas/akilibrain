const jobContainers = $('article .entry-content, .post-content, .job-listing, .vacancy-item, [itemtype*="JobPosting"]');
if (jobContainers.length === 0) {
    // No job containers found in the provided HTML structure (only head/meta tags present)
} else {
    jobContainers.each((index, element) => {
        const $el = $(element);
        const title = $el.find('h1, h2, h3, .job-title, [itemprop="title"]').first().text().trim();
        const companyName = $el.find('.company, .employer, [itemprop="hiringOrganization"]').first().text().trim() || 'United Nations';
        const description = $el.find('.description, .content, [itemprop="description"]').first().text().trim();
        const location = $el.find('.location, [itemprop="jobLocation"]').first().text().trim();
        const jobType = $el.find('.type, [itemprop="employmentType"]').first().text().trim().toLowerCase();
        const sourceUrl = $el.find('a[href*="job"], a[href*="vacancy"], a[href*="apply"]').first().attr('href') || '';
        const postedDate = $el.find('time, .date, [itemprop="datePosted"]').first().attr('datetime') || $el.find('time, .date, [itemprop="datePosted"]').first().text().trim();
        const deadline = $el.find('.deadline, [itemprop="validThrough"]').first().attr('datetime') || $el.find('.deadline, [itemprop="validThrough"]').first().text().trim();
        let salaryMin = null, salaryMax = null, salaryCurrency = '';
        const salaryText = $el.find('.salary, [itemprop="baseSalary"]').first().text().trim();
        if (salaryText) {
            const matches = salaryText.match(/([\d,.]+)\s*[-–]\s*([\d,.]+)\s*([A-Z]{3})/);
            if (matches) {
                salaryMin = parseFloat(matches[1].replace(/,/g, ''));
                salaryMax = parseFloat(matches[2].replace(/,/g, ''));
                salaryCurrency = matches[3];
            }
        }
        if (title) {
            result.push({
                title,
                companyName,
                description,
                location,
                jobType: ['full_time','part_time','contract','internship','remote'].includes(jobType) ? jobType : 'full_time',
                sourceUrl: sourceUrl.startsWith('http') ? sourceUrl : `https://careers.mitihani.co.tz${sourceUrl}`,
                postedDateIsoString: postedDate ? new Date(postedDate).toISOString() : '',
                deadlineIsoString: deadline ? new Date(deadline).toISOString() : '',
                salaryMin,
                salaryMax,
                salaryCurrency
            });
        }
    });
}