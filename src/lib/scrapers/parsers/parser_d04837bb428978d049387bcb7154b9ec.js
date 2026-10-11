let jobContainers = $('.job, .job-item, .listing, .vacancy, .career-item, .post, .job-card, [data-job]');
if (jobContainers.length) {
    jobContainers.each((i, el) => {
        const elem = $(el);
        const title = elem.find('.title, h2, h3, .job-title, .position').first().text().trim();
        if (!title) return;
        const companyName = elem.find('.company, .company-name').first().text().trim() || $('meta[property="og:site_name"]').attr('content') || '';
        const description = elem.find('.description, .desc, p').text().trim();
        const location = elem.find('.location, .job-location').first().text().trim();
        const typeText = elem.find('.type, .job-type').first().text().trim().toLowerCase();
        let jobType = '';
        if (/full\s*time/.test(typeText)) jobType = 'full_time';
        else if (/part\s*time/.test(typeText)) jobType = 'part_time';
        else if (/contract/.test(typeText)) jobType = 'contract';
        else if (/internship/.test(typeText)) jobType = 'internship';
        else if (/remote/.test(typeText)) jobType = 'remote';
        const sourceUrl = $('meta[property="og:url"]').attr('content') || '';
        const postedAttr = elem.find('time[datetime]').first().attr('datetime') || elem.find('.posted, .date-posted').first().text().trim();
        const postedDateIsoString = postedAttr ? new Date(postedAttr).toISOString() : '';
        const deadlineAttr = elem.find('time[datetime][class*="deadline"]').first().attr('datetime') || elem.find('.deadline, .apply-by').first().text().trim();
        const deadlineIsoString = deadlineAttr ? new Date(deadlineAttr).toISOString() : '';
        const salaryText = elem.find('.salary, .pay').first().text().trim();
        let salaryMin = null, salaryMax = null, salaryCurrency = null;
        if (salaryText) {
            const rangeMatch = salaryText.replace(/,/g, '').match(/([A-Za-z$€£]+)?\s*([\d\.]+)\s*(?:-|\s+to\s+)\s*([A-Za-z$€£]+)?\s*([\d\.]+)/i);
            if (rangeMatch) {
                salaryCurrency = (rangeMatch[1] || rangeMatch[3] || '').trim();
                salaryMin = parseFloat(rangeMatch[2]);
                salaryMax = parseFloat(rangeMatch[4]);
            } else {
                const singleMatch = salaryText.match(/([A-Za-z$€£]+)?\s*([\d\.]+)/);
                if (singleMatch) {
                    salaryCurrency = (singleMatch[1] || '').trim();
                    salaryMin = salaryMax = parseFloat(singleMatch[2]);
                }
            }
        }
        const job = { title };
        if (companyName) job.companyName = companyName;
        if (description) job.description = description;
        if (location) job.location = location;
        if (jobType) job.jobType = jobType;
        if (sourceUrl) job.sourceUrl = sourceUrl;
        if (postedDateIsoString) job.postedDateIsoString = postedDateIsoString;
        if (deadlineIsoString) job.deadlineIsoString = deadlineIsoString;
        if (salaryMin !== null) job.salaryMin = salaryMin;
        if (salaryMax !== null) job.salaryMax = salaryMax;
        if (salaryCurrency) job.salaryCurrency = salaryCurrency;
        result.push(job);
    });
}