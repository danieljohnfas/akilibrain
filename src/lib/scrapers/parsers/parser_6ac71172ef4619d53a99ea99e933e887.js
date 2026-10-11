(function() {
    var jobs = [];
    var ogType = $('meta[property="og:type"]').attr('content');
    var articleTypes = ['article', 'news', 'story', 'blog', 'feature'];
    if (ogType && articleTypes.indexOf(ogType) !== -1) {
        result.length = 0;
        return;
    }
    var schemaScript = $('script[type="application/ld+json"]');
    schemaScript.each(function() {
        try {
            var data = JSON.parse($(this).text());
            var isJob = false;
            if (data['@type'] && String(data['@type']).indexOf('JobPosting') !== -1) isJob = true;
            if (!isJob && data['@graph'] && Array.isArray(data['@graph'])) {
                data['@graph'].forEach(function(g) {
                    if (g['@type'] && String(g['@type']).indexOf('JobPosting') !== -1) isJob = true;
                });
            }
            if (isJob) {
                var items = data['@graph'] || [data];
                items.forEach(function(item) {
                    if (item['@type'] && String(item['@type']).indexOf('JobPosting') !== -1) {
                        var title = item.title || item.name || '';
                        if (title) {
                            jobs.push({
                                title: title,
                                companyName: item.hiringOrganization ? (item.hiringOrganization.name || '') : '',
                                location: item.workLocation ? (item.workLocation.name || '') : '',
                                description: item.description || '',
                                jobType: '',
                                postedDateIsoString: '',
                                sourceUrl: ''
                            });
                        }
                    }
                });
            }
        } catch (e) {}
    });
    if (jobs.length === 0) {
        var selectors = ['.job-item', '.job-card', '.job-posting', '.job-list-item', '.listing-item', '.position-item', '.recruitment-item', '[itemtype*="JobPosting"]'];
        var matchedSelector = '';
        selectors.forEach(function(sel) {
            if ($(sel).length) {
                matchedSelector = sel;
            }
        });
        if (matchedSelector) {
            $(matchedSelector).each(function() {
                var $el = $(this);
                var titleEl = $el.find('h1, h2, h3, h4, .job-title, .title').first();
                var companyEl = $el.find('.company, .company-name, .employer, .org').first();
                var locationEl = $el.find('.location, .loc, .job-location').first();
                var typeEl = $el.find('.type, .job-type, .employment-type').first();
                var dateEl = $el.find('.date, .posted-date, .publish-date').first();
                var descEl = $el.find('.description, .job-desc, .about, .desc').first();
                var applyEl = $el.find('a[href*="apply"], a[href*="/jobs/"], a.btn').first();
                var title = titleEl.text().trim();
                if (!title) return;
                if (/news|article|story|blog|update/i.test(title)) return;
                if (!/apply|hiring|vacancy|position|job/i.test($el.text()) && !applyEl.length) return;
                jobs.push({
                    title: title,
                    companyName: companyEl.text().trim(),
                    location: locationEl.text().trim(),
                    description: descEl.text().trim(),
                    jobType: normalizeJobType(typeEl.text()),
                    postedDateIsoString: dateEl.text().trim(),
                    sourceUrl: applyEl.attr('href') || ''
                });
            });
        }
    }
    function normalizeJobType(t) {
        t = (t || '').toLowerCase();
        if (t.indexOf('full') !== -1) return 'full_time';
        if (t.indexOf('part') !== -1) return 'part_time';
        if (t.indexOf('contract') !== -1) return 'contract';
        if (t.indexOf('intern') !== -1) return 'internship';
        if (t.indexOf('remote') !== -1) return 'remote';
        return '';
    }
    result.length = 0;
    jobs.forEach(function(j) {
        result.push(j);
    });
})();