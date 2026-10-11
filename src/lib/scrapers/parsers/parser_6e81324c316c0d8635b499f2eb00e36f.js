var jobContainers = $('#rtcl_listing');
if (jobContainers.length === 0) {
    return;
}

jobContainers.each(function() {
    var container = $(this);
    var job = {};

    var ld = container.find('[itemprop*="headline"], [itemprop*="name"], [itemprop*="description"], [itemprop*="address"], [itemprop*="jobType"], [itemprop*="currency"]');
    
    if (ld.length > 0) {
        job.title = ld.find('[itemprop="headline"]').text().trim() || '';
        job.companyName = ld.find('.organization').attr('name') || '';
        job.description = ld.find('[itemprop="description"]').text().trim() || '';
        job.postedDateIsoString = document.querySelector('meta[property="article:published_time"]').attr('content') || '';
        
        var salaryEl = container.find('[itemprop="salary"]');
        if (salaryEl.length > 0) {
            job.salaryMin = Number(salaryEl.find('.minimum').text().trim());
            job.salaryMax = Number(salaryEl.find('.maximum').text().trim());
            job.salaryCurrency = salaryEl.find('.currency').text().trim();
        }
    } else {
        var h1 = container.find('h1, h2, h3');
        if (h1.length > 0) {
            job.title = h1.text().trim();
            job.companyName = container.find('.company, .org-name').text().trim();
            job.description = container.find('.desc, .details').text().trim();
            job.postedDateIsoString = document.querySelector('meta[property="article:published_time"]').attr('content');
        }
    }

    if (job.jobType === 'unknown') {
        var titleLower = job.title.toLowerCase();
        if (titleLower.includes('remote')) job.jobType = 'remote';
        else if (titleLower.includes('internship')) job.jobType = 'internship';
        else if (titleLower.includes('contract')) job.jobType = 'contract';
        else if (titleLower.includes('part-time') || titleLower.includes('part time')) job.jobType = 'part_time';
        else if (titleLower.includes('full-time') || titleLower.includes('full time')) job.jobType = 'full_time';
    }

    var url = container.find('a[href]').first().attr('href');
    if (!url) url = '#';
    job.sourceUrl = url;

    result.push(job);
});