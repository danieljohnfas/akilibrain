let jobContainers = $('.job-card, .job-item, .listing, .result-item, .job-listing, .job'); 
if (jobContainers.length) {
    jobContainers.each(function () {
        let elem = $(this);
        let title = elem.find('.title, h2, h3, .job-title').first().text().trim();
        if (!title) return;
        let companyName = elem.find('.company, .company-name').first().text().trim() || null;
        let location = elem.find('.location, .job-location').first().text().trim() || null;
        let description = elem.find('.description, .job-description').first().text().trim() || null;
        let jobTypeText = elem.find('.type, .job-type').first().text().trim().toLowerCase() || '';
        let jobType = null;
        if (jobTypeText.includes('full')) jobType = 'full_time';
        else if (jobTypeText.includes('part')) jobType = 'part_time';
        else if (jobTypeText.includes('contract')) jobType = 'contract';
        else if (jobTypeText.includes('intern')) jobType = 'internship';
        else if (jobTypeText.includes('remote')) jobType = 'remote';
        let sourceUrl = elem.find('a').first().attr('href') || null;
        let postedDate = elem.find('time[datetime]').first().attr('datetime') || null;
        let deadline = elem.find('.deadline time[datetime]').first().attr('datetime') || null;
        let salaryText = elem.find('.salary, .pay').first().text();
        let salaryMin = null, salaryMax = null, salaryCurrency = null;
        if (salaryText) {
            let match = salaryText.replace(/,/g, '').match(/([A-Z]{3})?\s*(\d+(?:\.\d+)?)\s*[-–]\s*([A-Z]{3})?\s*(\d+(?:\.\d+)?)/i);
            if (match) {
                salaryCurrency = match[1] || match[3] || null;
                salaryMin = parseFloat(match[2]) || null;
                salaryMax = parseFloat(match[4]) || null;
            } else {
                let single = salaryText.replace(/,/g, '').match(/([A-Z]{3})?\s*(\d+(?:\.\d+)?)/i);
                if (single) {
                    salaryCurrency = single[1] || null;
                    salaryMin = parseFloat(single[2]) || null;
                }
            }
        }
        result.push({
            title,
            companyName,
            description,
            location,
            jobType,
            sourceUrl,
            postedDateIsoString: postedDate,
            deadlineIsoString: deadline,
            salaryMin,
            salaryMax,
            salaryCurrency
        });
    });
}