// Extract title – if none, treat page as non‑job and leave result empty
const title = $('h1').first().text().trim()
if (!title) { /* no clear job title */ } else {
  const job = { title }

  // Company name (prefer structured meta, fallback to common selectors)
  const metaCompany = $('meta[property="og:site_name"]').attr('content')
  const compSel = $('.company-name, .job-company, .employer, .posted-by').first().text().trim()
  const companyName = (metaCompany && metaCompany.trim()) || (compSel ? compSel : null)
  if (companyName) job.companyName = companyName

  // Description – common containers
  const desc = $('#job-description, .job-description, .entry-content, .post-content, article').first().text().trim()
  if (desc) job.description = desc

  // Location
  const loc = $('[class*="location"], .job-location, .location').first().text().trim()
  if (loc) job.location = loc

  // Job type – normalize to expected values
  const typeText = $('[class*="type"], .job-type, .employment-type').first().text().toLowerCase()
  if (typeText) {
    if (/full[\s-]?time/.test(typeText)) job.jobType = 'full_time'
    else if (/part[\s-]?time/.test(typeText)) job.jobType = 'part_time'
    else if (/contract/.test(typeText)) job.jobType = 'contract'
    else if (/internship/.test(typeText)) job.jobType = 'internship'
    else if (/remote/.test(typeText)) job.jobType = 'remote'
  }

  // Source URL
  const canonical = $('link[rel="canonical"]').attr('href')
  if (canonical) job.sourceUrl = canonical

  // Posted date
  const postedMeta = $('meta[property="article:published_time"]').attr('content')
  const postedTime = $('time[datetime]').attr('datetime')
  const postedDate = postedMeta || postedTime
  if (postedDate) job.postedDateIsoString = new Date(postedDate).toISOString()

  // Deadline date
  const deadlineSel = $('.deadline, .application-deadline, time.deadline[datetime]').first()
  const deadlineMeta = deadlineSel.attr('datetime')
  const deadlineText = deadlineSel.text().trim()
  let deadlineDate = deadlineMeta || deadlineText
  if (deadlineDate) {
    const parsed = new Date(deadlineDate)
    if (!isNaN(parsed)) job.deadlineIsoString = parsed.toISOString()
  }

  // Salary extraction – look for currency symbols and numbers
  const salaryText = $('.salary, .compensation, .pay-range').first().text()
  if (salaryText) {
    const currencyMatch = salaryText.match(/[\$£€¥]/)
    if (currencyMatch) job.salaryCurrency = currencyMatch[0]
    const numbers = salaryText.match(/[\d,.]+/g)
    if (numbers) {
      const nums = numbers.map(n => parseFloat(n.replace(/[,]/g, ''))).filter(n => !isNaN(n))
      if (nums.length === 1) {
        job.salaryMin = job.salaryMax = nums[0]
      } else if (nums.length >= 2) {
        job.salaryMin = Math.min(...nums)
        job.salaryMax = Math.max(...nums)
      }
    }
  }

  result.push(job)
}