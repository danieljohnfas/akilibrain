var hasJobs = false;
function cleanDate(str) {
    var d = new Date(str);
    return !isNaN(d.getTime()) ? d.toISOString() : '';
}
var salaryMin = 0, salaryMax = 0, salaryCurrency = '';
$('script[type="application/ld+json"]').each(function() {
    var text = $(this).text().trim();
    if (!text) return;
    try {
        var data = JSON.parse(text);
    } catch (e) { return; }
    var items = Array.isArray(data) ? data : [data];
    items.forEach(function(item) {
        if (!item) return;
        var type = item['@type'] || '';
        if (typeof type === 'string' && type.toLowerCase().indexOf('jobposting') !== -1) {
            hasJobs = true;
            var jobType = '';
            if (item.employmentType) {
                var et = item.employmentType;
                if (typeof et === 'string') jobType = et.toLowerCase().replace(/[_\s]/g, '_');
                if (Array.isArray(et)) jobType = et.map(function(x){return (x.type||x).toLowerCase().replace(/[_\s]/g, '_')}).join(',');
            }
            var salary = item.baseSalary || {};
            salaryMin = null; salaryMax = null; salaryCurrency = '';
            if (salary && typeof salary === 'object') {
                if (salary.currency) salaryCurrency = salary.currency;
                if (salary.minAmount && salary.minAmount.value) salaryMin = parseFloat(salary.minAmount.value);
                if (salary.maxAmount && salary.maxAmount.value) salaryMax = parseFloat(salary.maxAmount.value);
            }
            var hiringOrg = item.hiringOrganization || {};
            var orgName = '';
            if (typeof hiringOrg === 'object') {
                if (hiringOrg.name) orgName = hiringOrg.name;
                else if (Array.isArray(hiringOrg)) orgName = hiringOrg.map(function(o){return o.name||'';}).join(', ');
            }
            var location = item.workLocation || {};
            var locName = '';
            if (typeof location === 'object') {
                if (location.name) locName = location.name;
                else if (location.address && typeof location.address === 'object') locName = location.address.streetAddress || location.address.locality || '';
                else locName = location;
            }
            result.push({
                title: item.jobTitle || '',
                companyName: orgName,
                description: item.description || '',
                location: locName,
                jobType: jobType,
                sourceUrl: item.url || '',
                postedDateIsoString: cleanDate(item.datePosted),
                deadlineIsoString: cleanDate(item.hiringDeadline),
                salaryMin: salaryMin,
                salaryMax: salaryMax,
                salaryCurrency: salaryCurrency
            });
        }
    });
});
$('[itemtype="https://schema.org/JobPosting"], [typeof="https://schema.org/JobPosting"]').each(function() {
    hasJobs = true;
    var jobType = $(this).find('[itemprop="employmentType"]').first().text().trim().toLowerCase().replace(/[_\s]/g, '_');
    var salaryNode = $(this).find('[itemprop="baseSalary"]').first();
    salaryMin = null; salaryMax = null; salaryCurrency = '';
    salaryNode.find('[itemprop="minSalary"]').each(function() { var v = parseFloat($(this).attr('content') || $(this).text()); if(!isNaN(v)) salaryMin = v; });
    salaryNode.find('[itemprop="maxSalary"]').each(function() { var v = parseFloat($(this).attr('content') || $(this).text()); if(!isNaN(v)) salaryMax = v; });
    salaryNode.each(function() { if($(this).attr('itemprop') === 'baseSalary') salaryCurrency = $(this).attr('currency') || $(this).find('[itemprop="currency"]').first().attr('content') || ''; });
    var orgNode = $(this).find('[itemprop="hiringOrganization"]').first();
    var orgName = orgNode.find('[itemprop="name"]').first().text().trim();
    var locNode = $(this).find('[itemprop="workLocation"]').first();
    var locName = locNode.find('[itemprop="name"]').first().text().trim();
    result.push({
        title: $(this).find('[itemprop="title"]').first().text().trim(),
        companyName: orgName,
        description: $(this).find('[itemprop="description"]').first().text().trim(),
        location: locName,
        jobType: jobType,
        sourceUrl: $(this).find('[itemprop="url"]').first().attr('href') || '',
        postedDateIsoString: cleanDate($(this).find('[itemprop="datePosted"]').first().attr('content') || $(this).find('[itemprop="datePosted"]').first().text()),
        deadlineIsoString: cleanDate($(this).find('[itemprop="hiringDeadline"]').first().attr('content') || ''),
        salaryMin: salaryMin,
        salaryMax: salaryMax,
        salaryCurrency: salaryCurrency
    });
});