const metaUrl = $('meta[property="og:url"]').attr('content') || $('link[rel="canonical"]').attr('href') || '';
const postedMeta = $('meta[property="article:published_time"]').attr('content') || '';
const siteName = $('meta[property="og:site_name"]').attr('content') || '';
const containers = $('.entry-content').find('h2, h3, .job, .vacancy, .job-item, li').toArray();
const processed = new Set();

containers.forEach(node => {
  const $node = $(node);
  if (!$node.text().trim()) return;

  // Define a container element that likely holds full job info
  let $container = $node;
  if ($node.is('h2, h3')) $container = $node.parent();

  const uniqueKey = $container[0] && $container[0].startIndex !== undefined ? $container[0].startIndex : $container.html();
  if (processed.has(uniqueKey)) return;
  processed.add(uniqueKey);

  // Title extraction
  let title = $node.find('.job-title, .title').first().text().trim();
  if (!title) {
    if ($node.is('h2, h3')) title = $node.text().trim();
    else title = $node.text().trim();
  }

  // Discard non‑job entries
  const lowerTitle = title.toLowerCase();
  const invalidTitle = [/job vacancy/i, /vacancies/i, /career/i, /opportunity/i, /apply/i];
  if (!title || invalidTitle.some(r => r.test(lowerTitle))) return;

  // Description – first paragraph inside container
  const description = $container.find('p').first().text().trim();

  // Location detection
  const locMatch = $container.text().match(/location[:\s]*([A-Za-z0-9 ,.-]+)/i);
  const location = locMatch ? locMatch[1].trim() : '';

  // Job type detection
  const txt = $container.text().toLowerCase();
  let jobType = null;
  if (/full[-\s]?time/.test(txt)) jobType = 'full_time';
  else if (/part[-\s]?time/.test(txt)) jobType = 'part_time';
  else if (/contract/.test(txt)) jobType = 'contract';
  else if (/internship/.test(txt)) jobType = 'internship';
  else if (/remote/.test(txt)) jobType = 'remote';

  // Salary extraction
  let salaryMin = null, salaryMax = null, salaryCurrency = null;
  const salMatch = $container.text().match(/(?:salary[:\s]*)?([$£€]|TZS)?\s?([\d,]+)\s?(?:-|\sto\s)\s?(?:[$£€]|TZS)?\s?([\d,]+)/i);
  if (salMatch) {
    salaryCurrency = salMatch[1] || '';
    salaryMin = Number(salMatch[2].replace(/,/g, ''));
    salaryMax = Number(salMatch[3].replace(/,/g, ''));
  }

  result.push({
    title,
    companyName: siteName,
    description,
    location,
    jobType,
    sourceUrl: metaUrl,
    postedDateIsoString: postedMeta,
    deadlineIsoString: '',
    salaryMin,
    salaryMax,
    salaryCurrency
  });
});