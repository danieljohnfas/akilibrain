var jobSelectors = [
  'article[data-job]',
  '.job-card',
  '.job-post',
  '.job-item',
  '.job-listing',
  'li[data-props*="job"]',
  '[role="article"][aria-label*="job"]',
  '.job'
];

var containers = $(jobSelectors.join(', '));
var extractedJobs = [];

containers.each(function() {
  var $el = $(this);
  var $title = $el.find('h1, h2, h3, [class*="title"], [data-testid*="title"], [data-props*="title"]').first();
  var title = $title.length ? $title.text().trim() : null;
  
  if (!title) return;
  
  var $company = $el.find('[class*="company"], [data-testid*="company"]').first();
  var $desc = $el.find('[class*="description"]').first();
  var $location = $el.find('[class*="location"], [class*="place"], [class*="geo"]').first();
  var $type = $el.find('[class*="type"], [class*="job-type"], [class*="employment"]').first();
  
  var job = {
    title: title,
    companyName: $company.length ? $company.text().trim() : '',
    description: $desc.length ? $desc.text().trim() : '',
    location: $location.length ? $location.text().trim() : '',
    jobType: $type.length ? $type.text().trim() : '',
    sourceUrl: '',
    postedDateIsoString: '',
    deadlineIsoString: '',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: ''
  };
  
  var $link = $el.find('a[href]').first();
  if ($link.length && $link.attr('href')) {
    job.sourceUrl = $link.attr('href');
  }
  
  extractedJobs.push(job);
});

if (extractedJobs.length > 0) {
  extractedJobs.forEach(function(job) {
    result.push(job);
  });
}