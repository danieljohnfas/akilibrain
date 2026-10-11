const jobContainers = $('.view-content .views-row, .job-listing, .node-job, article[data-node-type="job"], .job-item');

jobContainers.each((_, container) => {
  const $c = $(container);
  const titleElem = $c.find('h1, h2, h3').first();
  const title = titleElem.text().trim();
  if (!title) return;

  const job = {
    title,
    companyName: $c.find('.company, .company-name, .field--name-field-company').text().trim() || undefined,
    description: $c.find('.description, .field--name-body, .job-description').text().trim() || undefined,
    location: $c.find('.location, .field--name-field-location').text().trim() || undefined,
    jobType: (function () {
      const txt = $c.find('.job-type, .field--name-field-job-type').text().toLowerCase();
      if (/full\s*time/.test(txt)) return 'full_time';
      if (/part\s*time/.test(txt)) return 'part_time';
      if (/contract/.test(txt)) return 'contract';
      if (/internship/.test(txt)) return 'internship';
      if (/remote/.test(txt)) return 'remote';
      return undefined;
    })(),
    sourceUrl: $c.find('a[href]').first().attr('href') ? new URL($c.find('a[href]').first().attr('href'), 'https://udsm.ac.tz').href : undefined,
    postedDateIsoString: (function () {
      const dateTxt = $c.find('.posted, .field--name-field-posted-date').text().trim();
      const d = new Date(dateTxt);
      return isNaN(d) ? undefined : d.toISOString();
    })(),
    deadlineIsoString: (function () {
      const dateTxt = $c.find('.deadline, .field--name-field-deadline').text().trim();
      const d = new Date(dateTxt);
      return isNaN(d) ? undefined : d.toISOString();
    })(),
    salaryMin: (function () {
      const txt = $c.find('.salary, .field--name-field-salary').text().replace(/[^0-9]/g, '');
      const num = parseInt(txt, 10);
      return isNaN(num) ? undefined : num;
    })(),
    salaryMax: undefined,
    salaryCurrency: (function () {
      const txt = $c.find('.salary, .field--name-field-salary').text().trim();
      const match = txt.match(/([A-Za-z]{3})/);
      return match ? match[1] : undefined;
    })()
  };

  result.push(job);
});