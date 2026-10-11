(function($) {
  var jobContainers = $('.job-listing, .job-item, article.post, .post-body');
  if (jobContainers.length === 0) {
    jobContainers = [$('body')];
  }
  jobContainers.each(function(_, elem) {
    var $container = $(elem);
    var title = $container.find('.job-title, h1, h2, h3').first().text().trim();
    if (!title) return;
    var $content = $container.find('.post-body, .post-content, #blog_post_body');
    var description = $content.length ? $content.text().trim() : $container.text().trim();
    if (description.startsWith(title)) description = description.substring(title.length).trim();
    var companyName = null;
    var companyMatch = /Company[:\s]-?\s*([^\n]+)/i.exec(description) || /Employer[:\s]-?\s*([^\n]+)/i.exec(description) || /Organisation[:\s]-?\s*([^\n]+)/i.exec(description);
    if (companyMatch) companyName = companyMatch[1].trim();
    var location = null;
    var locationMatch = /Location[:\s]-?\s*([^\n]+)/i.exec(description) || /Based in[:\s]-?\s*([^\n]+)/i.exec(description) || /City[:\s]-?\s*([^\n]+)/i.exec(description);
    if (locationMatch) location = locationMatch[1].trim();
    var jobType = null;
    var jobTypeMatch = description.match(/\b(Full[ -]?time|Part[ -]?time|Contract|Internship|Remote)\b/i);
    if (jobTypeMatch) jobType = jobTypeMatch[0].toLowerCase().replace(/[- ]/g, '_');
    var salaryMin = null, salaryMax = null, salaryCurrency = null;
    var salaryMatch = /Salary[:\s]-?\s*([^\n]+)/i.exec(description) || /Pay[:\s]-?\s*([^\n]+)/i.exec(description) || /Compensation[:\s]-?\s*([^\n]+)/i.exec(description);
    if (salaryMatch) {
      var salaryText = salaryMatch[1];
      var curMatch = salaryText.match(/([$€£¥]|KES|USD|EUR|GBP|CAD|AUD)\s*/i);
      if (curMatch) salaryCurrency = curMatch[0];
      var numMatches = salaryText.match(/\d[\d,.]*\s*/g);
      if (numMatches && numMatches.length >= 2) {
        salaryMin = parseFloat(numMatches[0].replace(/[^\d.]/g, ''));
        salaryMax = parseFloat(numMatches[1].replace(/[^\d.]/g, ''));
      } else if (numMatches && numMatches.length === 1) {
        salaryMin = parseFloat(numMatches[0].replace(/[^\d.]/g, ''));
      }
    }
    var sourceUrl = $('link[rel="canonical"]').attr('href') || '';
    var postedDateIsoString = null;
    var postedMeta = $('meta[property="article:published_time"]').attr('content');
    if (postedMeta) postedDateIsoString = postedMeta;
    else {
      var dateMatch = description.match(/\b(\d{1,2}[\/\-\.]?\w+[\\/\-\.]?\d{4})\b/);
      if (dateMatch) {
        var d = new Date(dateMatch[0]);
        if (!isNaN(d)) postedDateIsoString = d.toISOString();
      }
    }
    var deadlineIsoString = null;
    var deadlineMatch = /Deadline[:\s]-?\s*([^\n]+)/i.exec(description) || /Apply by[:\s]-?\s*([^\n]+)/i.exec(description) || /Closes[:\s]-?\s*([^\n]+)/i.exec(description) || /Expires[:\s]-?\s*([^\n]+)/i.exec(description);
    if (deadlineMatch) {
      var dl = new Date(deadlineMatch[1]);
      if (!isNaN(dl)) deadlineIsoString = dl.toISOString();
    }
    var job = {
      title: title,
      companyName: companyName,
      description: description,
      location: location,
      jobType: jobType,
      sourceUrl: sourceUrl,
      postedDateIsoString: postedDateIsoString,
      deadlineIsoString: deadlineIsoString,
      salaryMin: salaryMin,
      salaryMax: salaryMax,
      salaryCurrency: salaryCurrency
    };
    if (title && description) result.push(job);
  });
})( $ );