const jobContainers = $('.job-listing, .job-card, .vacancy-item, .job-post, [itemtype="http://schema.org/JobPosting"], [itemtype="https://schema.org/JobPosting"], .job-item, .career-item');

if (jobContainers.length === 0) {
  const listContainer = $('.jobs-list, .job-listings, .vacancies, #jobs-container, .row.jobs, .job-results, .search-results');
  if (listContainer.length) {
    listContainer.find('a[href*="/job/"], a[href*="/vacancy/"], a[href*="/career/"]').each((i, el) => {
      const $el = $(el);
      const title = $el.find('.job-title, .title, h3, h2, h4').first().text().trim() || $el.text().trim();
      const href = $el.attr('href');
      if (title && href) {
        const sourceUrl = href.startsWith('http') ? href : 'https://www.ngoera.com' + href;
        result.push({
          title,
          companyName: '',
          description: '',
          location: '',
          jobType: '',
          sourceUrl,
          postedDateIsoString: '',
          deadlineIsoString: '',
          salaryMin: null,
          salaryMax: null,
          salaryCurrency: ''
        });
      }
    });
  }
} else {
  jobContainers.each((i, container) => {
    const $container = $(container);
    let title = $container.find('.job-title, .title, h3, h2, h4, [itemprop="title"]').first().text().trim();
    let companyName = $container.find('.company, .company-name, .organization, [itemprop="hiringOrganization"] [itemprop="name"], [itemprop="name"]').first().text().trim();
    let location = $container.find('.location, .job-location, [itemprop="jobLocation"] [itemprop="address"] [itemprop="addressLocality"], [itemprop="addressLocality"]').first().text().trim();
    let description = $container.find('.description, .excerpt, .summary, [itemprop="description"]').first().text().trim();
    let jobType = $container.find('.job-type, .type, .badge, [itemprop="employmentType"]').first().text().trim().toLowerCase();
    let sourceUrl = $container.find('a[href*="/job/"], a[href*="/vacancy/"], a[href*="/career/"]').first().attr('href') || $container.find('a').first().attr('href');
    let postedDate = $container.find('.date, .posted-date, [itemprop="datePosted"]').first().attr('datetime') || $container.find('.date, .posted-date, [itemprop="datePosted"]').first().text().trim();
    let deadline = $container.find('.deadline, .expiry-date, [itemprop="validThrough"]').first().attr('datetime') || $container.find('.deadline, .expiry-date, [itemprop="validThrough"]').first().text().trim();
    let salaryText = $container.find('.salary, .compensation, [itemprop="baseSalary"]').first().text().trim();

    if (sourceUrl && !sourceUrl.startsWith('http')) {
      sourceUrl = 'https://www.ngoera.com' + sourceUrl;
    }

    function parseDate(dateStr) {
      if (!dateStr) return '';
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
    }

    function parseSalary(text) {
      const result = { min: null, max: null, currency: '' };
      if (!text) return result;
      const currencyMatch = text.match(/([$€£¥₹]|USD|EUR|GBP|INR|KES|TZS|UGX|RWF|ZAR|NGN|GHS|XOF|XAF)/i);
      if (currencyMatch) result.currency = currencyMatch[1].toUpperCase();
      const numbers = text.match(/[\d,]+(?:\.\d+)?/g);
      if (numbers && numbers.length >= 1) {
        result.min = parseFloat(numbers[0].replace(/,/g, ''));
        if (numbers.length >= 2) {
          result.max = parseFloat(numbers[1].replace(/,/g, ''));
        } else {
          result.max = result.min;
        }
      }
      return result;
    }

    const salary = parseSalary(salaryText);

    const normalizedJobType = (() => {
      if (!jobType) return '';
      const jt = jobType.toLowerCase();
      if (jt.includes('full')) return 'full_time';
      if (jt.includes('part')) return 'part_time';
      if (jt.includes('contract') || jt.includes('temporary')) return 'contract';
      if (jt.includes('intern')) return 'internship';
      if (jt.includes('remote') || jt.includes('work from home')) return 'remote';
      return '';
    })();

    if (title) {
      result.push({
        title,
        companyName: companyName || '',
        description: description || '',
        location: location || '',
        jobType: normalizedJobType,
        sourceUrl: sourceUrl || '',
        postedDateIsoString: parseDate(postedDate),
        deadlineIsoString: parseDate(deadline),
        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryCurrency: salary.currency
      });
    }
  });
}