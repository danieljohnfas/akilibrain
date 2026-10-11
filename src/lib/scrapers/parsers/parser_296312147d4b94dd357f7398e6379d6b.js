result.length = 0;
$('.job-listing, .job-item, .job-card, .job-posting').each(function () {
    const $el = $(this);
    const title = $el.find('h2, h3, .title, .job-title').first().text().trim();
    if (!title) return;
    const company = $el.find('.company, .org, .employer').first().text().trim();
    const description = $el.find('.desc, .description, .details').text().trim();
    const location = $el.find('.location, .place, .city').text().trim();
    const jobTypeText = $el.text().toLowerCase();
    let jobType = 'full_time';
    if (jobTypeText.includes('part')) jobType = 'part_time';
    else if (jobTypeText.includes('contract')) jobType = 'contract';
    else if (jobTypeText.includes('intern')) jobType = 'internship';
    else if (jobTypeText.includes('remote')) jobType = 'remote';
    const postedDateIso = $el.find('time, .date-posted, .posted-date').first().attr('datetime') || $el.find('time').first().attr('datetime');
    const deadlineIso = $el.find('.deadline, .closing-date, time').first().attr('datetime');
    const salaryText = $el.find('.salary, .pay, .compensation').text().trim();
    let salaryMin = 0, salaryMax = 0, salaryCurrency = '';
    const num = s => parseFloat(s.replace(/,/g, ''));
    if (salaryText) {
        const parts = salaryText.split('-');
        if (parts.length === 2) {
            const low = num(parts[0]);
            const high = num(parts[1]);
            if (low) salaryMin = low;
            if (high) salaryMax = high;
        } else if (num(parts[0])) salaryMin = num(parts[0]);
        const cur = salaryText.match(/([A-Z]{3})/);
        if (cur) salaryCurrency = cur[1];
    }
    const sourceUrl = $el.find('a').first().attr('href') || '';
    const articlePosted = $('meta[property="article:published_time"]').attr('content');
    const articleModified = $('meta[property="article:modified_time"]').attr('content');
    const postedDateIsoString = articlePosted ? articlePosted.replace('Z$', '') : '';
    const deadlineIsoString = articleModified ? articleModified.replace('Z$', '') : '';
    const job = {
        title,
        companyName: company,
        description,
        location,
        jobType,
        sourceUrl,
        postedDateIsoString,
        deadlineIsoString,
        salaryMin,
        salaryMax,
        salaryCurrency,
    };
    result.push(job);
});