const cleanText = (element) => {
    if (!element || !$(element).length) return '';
    return $(element).text().trim();
};

const getAttr = (element, attr) => {
    if (!element || !$(element).length) return '';
    return $(element).attr(attr) || '';
};

$('div.job-item').each((index, element) => {
    const $job = $(element);

    const title = cleanText($job.find('div.job-info h3'));

    if (!title) {
        return; 
    }

    let sourceUrl = getAttr($job.find('div.job-info a'), 'href');
    if (sourceUrl && !sourceUrl.startsWith('http')) {
        sourceUrl = 'https://www.kazi-interim.com' + sourceUrl;
    }

    const companyName = cleanText($job.find('div.job-company span'));
    const location = cleanText($job.find('div.job-location span'));

    let jobType = '';
    const jobTypeRaw = cleanText($job.find('div.job-category span')).toLowerCase();
    if (jobTypeRaw.includes('full-time') || jobTypeRaw.includes('cdi')) {
        jobType = 'full_time';
    } else if (jobTypeRaw.includes('part-time')) {
        jobType = 'part_time';
    } else if (jobTypeRaw.includes('contract') || jobTypeRaw.includes('cdd')) {
        jobType = 'contract';
    } else if (jobTypeRaw.includes('internship') || jobTypeRaw.includes('stage')) {
        jobType = 'internship';
    } else if (jobTypeRaw.includes('remote') || jobTypeRaw.includes('télétravail')) {
        jobType = 'remote';
    }

    let postedDateIsoString = '';
    const postedDateText = cleanText($job.find('div.job-date span'));
    const dateMatch = postedDateText.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch && dateMatch[1]) {
        postedDateIsoString = dateMatch[1];
    }

    const description = '';
    const deadlineIsoString = '';
    const salaryMin = null;
    const salaryMax = null;
    const salaryCurrency = '';

    result.push({
        title,
        companyName,
        description,
        location,
        jobType,
        sourceUrl,
        postedDateIsoString,
        deadlineIsoString,
        salaryMin,
        salaryMax,
        salaryCurrency,
    });
});