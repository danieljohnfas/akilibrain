(function() {
  var processedNodes = new Set();
  var links = $('a[href]');
  links.each(function() {
    var $link = $(this);
    var href = $link.attr('href');
    if (!href || href.indexOf('view-job') === -1) return;
    var $container = $link.closest('li, .job, .job-card, .listing-item, tr');
    if (!$container.length) return;
    var node = $container.get(0);
    if (processedNodes.has(node)) return;
    processedNodes.add(node);
    var title = $link.text().trim();
    if (!title) return;
    var companyName = $container.find('.company, .organization, .client, .employers').first().text().trim();
    var location = $container.find('.location, .place, .site, .country').first().text().trim();
    var typeText = $container.find('.job-type, .work-type, .type, .appointment-type').first().text().trim();
    var jobType = 'full_time';
    var t = typeText.toLowerCase();
    var loc = location.toLowerCase();
    if (loc.indexOf('remote') !== -1) jobType = 'remote';
    else if (t.indexOf('intern') !== -1) jobType = 'internship';
    else if (t.indexOf('contract') !== -1) jobType = 'contract';
    else if (t.indexOf('part') !== -1) jobType = 'part_time';
    else if (t.indexOf('consult') !== -1 || t.indexOf('fixed') !== -1 || t.indexOf('temporary') !== -1) jobType = 'contract';
    var salaryText = $container.text();
    var salaryMatch = salaryText.match(/(\d+[\d,]*)\s*-\s*(\d+[\d,]*)\s*([A-Z]{3})/i);
    var salaryMin = null;
    var salaryMax = null;
    var salaryCurrency = '';
    if (salaryMatch) {
      salaryCurrency = salaryMatch[3];
      salaryMin = parseFloat(salaryMatch[1].replace(/,/g, '')) || null;
      salaryMax = parseFloat(salaryMatch[2].replace(/,/g, '')) || null;
    }
    var postedDate = $container.find('.posted, .date, .date-posted').first().text().trim();
    var postedDateIso = '';
    if (/^\d{4}-\d{2}-\d{2}/.test(postedDate)) postedDateIso = postedDate;
    result.push({
      title: title,
      companyName: companyName,
      description: '',
      location: location,
      jobType: jobType,
      sourceUrl: href,
      postedDateIsoString: postedDateIso,
      deadlineIsoString: '',
      salaryMin: salaryMin,
      salaryMax: salaryMax,
      salaryCurrency: salaryCurrency
    });
  });
})();