const selectors = '.job-card, .job-item, .vacancy, [data-job-id], .listing-item, .position-card, .job-listing, article.job';
const $cards = $(selectors);
$cards.each(function () {
  const $card = $(this);
  const $title = $card.find('h1, h2, h3, .job-title, [class*="title"]').first();
  const title = $title.text().trim();
  if (!title || title.length < 3) return;
  const $apply = $card.find('a').filter(function () {
    const text = $(this).text().toLowerCase();
    return text.indexOf('apply') !== -1 || text.indexOf('post') !== -1 || text.indexOf('hiring') !== -1;
  }).first();
  if (!$apply.length) return;
  const company = $card.find('h2, h3, .company, [class*="company"], .org, [class*="org"]').first().text().trim();
  const location = $card.find('span, div, .location, [class*="location"], [class*="place"], [class*="address"]').first().text().trim();
  const $type = $card.find('span, div, .type, [class*="type"], [class*="work-type"]').first().text().trim().toLowerCase();
  const typeMap = {
    'full-time': 'full_time',
    'full time': 'full_time',
    'fulltime': 'full_time',
    'full_time': 'full_time',
    'part-time': 'part_time',
    'part time': 'part_time',
    'parttime': 'part_time',
    'contract': 'contract',
    'internship': 'internship',
    'remote': 'remote'
  };
  const jobType = typeMap[$type] || $type;
  const description = $card.find('div.description, .description, [class*="description"], p').text().trim();
  const postedDate = $card.find('time, .date, .posted, [class*="date"], [class*="time"]').first().text().trim();
  const deadline = $card.find('.deadline, [class*="deadline"], [class*="due-date"]').first().text().trim();
  const salaryRaw = $card.find('.salary, [class*="salary"], span, .earnings').first().text().trim();
  const sourceUrl = $apply.attr('href') || '';
  const job = {
    title: title,
    sourceUrl: sourceUrl,
    postedDateIsoString: '',
    deadlineIsoString: '',
    companyName: company || '',
    description: description || '',
    location: location || '',
    jobType: jobType || '',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: ''
  };
  result.push(job);
});
if (typeof result === 'undefined') {
  var result = [];
}
result.forEach = result.forEach;
```