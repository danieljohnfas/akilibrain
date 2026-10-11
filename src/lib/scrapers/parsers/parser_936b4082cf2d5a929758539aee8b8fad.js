const jobSelectors = [
  '[itemtype*="JobPosting"]',
  '[data-testid*="job"]',
  '[class*="job-card"]',
  '[class*="job-listing"]',
  '[class*="job-item"]',
  '[class*="job-search"]',
  '.job',
  '.job-card',
  '.job-listing',
  '.job-item',
  '.listing-job',
  '.job-search-result',
];

for (let s = 0; s < jobSelectors.length; s++) {
  const items = $(jobSelectors[s]);
  if (items.length === 0) continue;

  items.each(function () {
    const $item = $(this);
    const titleEls = $item.find('h1, h2, h3, h4, [class*="title"], [class*="job-title"]')
      .filter(function () {
        return $(this).text().trim().length > 2;
      });
    const title = titleEls.first().text().trim();

    if (!title) return;

    const job = {
      title: title,
      companyName: $item.find('[class*="company"], [class*="org-name"], [class*="organization"]')
        .first().text().trim() || '',
      location: $item.find('[class*="location"], [class*="address"]')
        .first().text().trim() || '',
    };

    const link = $item.find('a[href]').first();
    if (link.length && link.attr('href') && link.attr('href').indexOf('http') === 0) {
      job.sourceUrl = link.attr('href');
    }

    result.push(job);
  });

  break;
}