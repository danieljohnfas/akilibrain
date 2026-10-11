var selectors = ['article.job', '.job-card', '.job-listing', '.listing-item', 'li.job', '[data-job-id]', 'tr.job'];
var jobSelector = null;
var i, len, el, $el, title;
for (i = 0, len = selectors.length; i < len; i++) {
  if ($(selectors[i]).length > 0) {
    jobSelector = selectors[i];
    break;
  }
}
if (jobSelector) {
  $(jobSelector).each(function() {
    $el = $(this);
    title = $el.find('h1, h2, h3, .title, [data-title], [itemprop="title"]').first().text().trim();
    if (!title) return;
    result.push({
      title: title,
      companyName: $el.find('.company, .company-name, [data-company], [itemprop="employer"]').first().text().trim(),
      description: $el.text().trim(),
      location: $el.find('.location, .address, [data-location], [itemprop="location"]').first().text().trim(),
      jobType: $el.find('.type, .job-type, [data-type], [itemprop="employmentType"]').first().text().trim(),
      sourceUrl: $el.find('a[href]').first().attr('href') || '',
      postedDateIsoString: '',
      deadlineIsoString: '',
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: 'USD'
    });
  });
}