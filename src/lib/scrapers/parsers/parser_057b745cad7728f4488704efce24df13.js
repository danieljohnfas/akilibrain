(function() {
  var titleText = $('title').text().trim();
  var ogTitle = $('meta[property="og:title"]').attr('content') || '';
  var ogDesc = $('meta[property="og:description"]').attr('content') || '';
  var pageContent = (titleText + ' ' + ogTitle + ' ' + ogDesc).toLowerCase();
  var jobKeywords = ['hiring', 'jobs', 'careers', 'job opening', 'we are hiring', 'join our team', 'now hiring'];
  var isJobPage = jobKeywords.some(function(k) { return pageContent.indexOf(k) !== -1; });

  if (!isJobPage) {
    var $potential = $('div, article, section, tr').filter(function() {
      var cls = $(this).attr('class') || '';
      var hasLink = $(this).find('a').first().attr('href') || '';
      return (cls.match(/\b(job|career|hiring|position|role)\b/) || $(this).attr('data-job') || hasLink).match(/(apply|jobs|career)/);
    });
    if ($potential.length === 0) {
      return;
    }
  }

  var $jobs = $();
  if (isJobPage) {
    $jobs = $('article.job, div.job-card, .job-listing, .listing-item, tr.job, [data-job-id]').filter(':has(h1), :has(h2), :has(h3)');
  }
  if ($jobs.length === 0) {
    $jobs = $potential;
  }

  $jobs.each(function() {
    var $el = $(this);
    var title = '';
    $el.find('h1, h2, h3').each(function() {
      var t = $(this).text().trim();
      if (t && t.length > 3 && !/contact|support|faq|about|privacy|terms/i.test(t)) {
        title = t;
        return false;
      }
    });
    if (!title) return;

    var obj = {
      title: title,
      companyName: '',
      description: '',
      location: '',
      jobType: '',
      sourceUrl: '',
      postedDateIsoString: '',
      deadlineIsoString: '',
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: ''
    };
    obj.companyName = $el.find('.company-name, .company, .organization, .employer-name, a[href*="/company"]').first().text().trim();
    obj.description = $el.find('.description, .job-desc, p').first().text().trim().slice(0, 5000);
    obj.location = $el.find('.location, .job-location, [class*="place"]').first().text().trim();
    obj.jobType = $el.find('.type, .job-type, [class*="type"], .salary').first().text().trim().toLowerCase();
    obj.sourceUrl = $el.find('a').first().attr('href') || '';

    var salaryText = $el.find('.salary, .pay, [class*="salary"]').text();
    var nums = salaryText.match(/(\d[\d,]*)/g);
    if (nums) {
      obj.salaryMin = parseInt(nums[0].replace(/,/g, ''), 10);
      obj.salaryMax = nums.length > 1 ? parseInt(nums[1].replace(/,/g, ''), 10) : obj.salaryMin;
      obj.salaryCurrency = 'USD';
    }

    if (obj.title === obj.companyName) {
      obj.title = '';
    }
    if (obj.title) {
      result.push(obj);
    }
  });
})();