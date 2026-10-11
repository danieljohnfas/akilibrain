const job = {
    title: null,
    companyName: null,
    description: null,
    location: null,
    jobType: null,
    sourceUrl: null,
    postedDateIsoString: null,
    deadlineIsoString: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null
};

const sourceUrl = $('link[rel="canonical"]').attr('href') || $('meta[property="og:url"]').attr('content');
if (sourceUrl) {
    job.sourceUrl = sourceUrl.trim();
}

const h1Text = $('h1.entry-title').text().trim();
if (h1Text) {
    const jobVacancyPattern = /^(.*?)\s*Job Vacancy at\s*(.*?)(?:\s*—.*)?$/i;
    const match = h1Text.match(jobVacancyPattern);

    if (match && match[1] && match[2]) {
        job.title = match[1].trim();
        
        let potentialCompany = match[2].trim();
        
        const companyDateSeparatorIndex = potentialCompany.indexOf('—');
        if (companyDateSeparatorIndex !== -1) {
            job.companyName = potentialCompany.substring(0, companyDateSeparatorIndex).trim();
        } else {
            job.companyName = potentialCompany;
        }
    } else {
        job.title = h1Text;
        
        if (job.title.includes('—')) {
            job.title = job.title.split('—')[0].trim();
        }
        job.title = job.title.replace(/\s*Job Vacancy$/i, '').trim();
    }
}

const descriptionElement = $('.entry-content');
if (descriptionElement.length) {
    job.description = descriptionElement.html().trim();
}

const postedDateMeta = $('meta[property="article:published_time"]').attr('content');
if (postedDateMeta) {
    job.postedDateIsoString = postedDateMeta.trim();
}

if (job.title) {
    result.push(job);
}