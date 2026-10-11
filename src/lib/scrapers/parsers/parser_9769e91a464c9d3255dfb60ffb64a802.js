const $jobContainers = $('.job, .vacancy, .position, .listing, .job-item, .job-card');
$jobContainers.each((i, el) => {
    const $job = $(el);
    const title = $job.find('.job-title, h2, h3, .title').first().text().trim();
    if (!title) return;
    const company = $job.find('.company, .org, .employer, .organization').text().trim();
    const location = $job.find('.location, .place, .city').text().trim();
    const jobTypeRaw = ($job.find('.job-type, .type, .category').first().text() || '').trim().toLowerCase();
    let jobType = 'full_time';
    if (jobTypeRaw.includes('part')) jobType = 'part_time';
    else if (jobTypeRaw.includes('contract')) jobType = 'contract';
    else if (jobTypeRaw.includes('intern')) jobType = 'internship';
    else if (jobTypeRaw.includes('remote')) jobType = 'remote';
    const description = $job.find('.description, .details, .summary').text().trim();
    const postedDateStr = $job.find('time.posted-date, .posted-date, .date').attr('datetime') || $job.find('time.posted-date, .posted-date, .date').text().trim();
    const postedDateIso = postedDateStr ? new Date(postedDateStr).toISOString() : '';
    const deadlineStr = $job.find('time.deadline, .deadline, .closing-date').attr('datetime') || $job.find('time.deadline, .deadline, .closing-date').text().trim();
    const deadlineIso = deadlineStr ? new Date(deadlineStr).toISOString() : '';
    const salaryText = $job.find('.salary, .pay, .compensation').text().trim();
    let salaryMin = null, salaryMax = null, salaryCurrency = '';
    if (salaryText) {
        const numMatch = salaryText.match(/\d+(?:\.\d+)?/g);
        if (numMatch) {
            salaryMin = parseFloat(numMatch[0]);
            salaryMax = numMatch.length > 1 ? parseFloat(numMatch[1]) : salaryMin;
        }
        const currencyMatch = salaryText.match(/([A-Z]{3})/);
        if (currencyMatch) salaryCurrency = currencyMatch[1];
    }
    const sourceUrl = $('meta[property="og:url"]').attr('content') || $job.find('a.job-link, a.title, a.details').attr('href') || '';
    const job = {
        title,
        companyName: company,
        description,
        location,
        jobType,
        sourceUrl,
        postedDateIsoString: postedDateIso,
        deadlineIsoString: deadlineIso,
        salaryMin,
        salaryMax,
        salaryCurrency,
    };
    result.push(job);
});