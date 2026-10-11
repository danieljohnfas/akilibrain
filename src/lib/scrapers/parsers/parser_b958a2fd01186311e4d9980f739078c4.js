document.addEventListener('DOMContentLoaded', function() {
  const jobCards = $('[class*="job"], [class*="Job"], [class*="card"], [class*="Card"]').filter(function() {
    const text = $(this).text().toLowerCase();
    return text.includes('job') || text.includes('position') || text.includes('role') || text.includes('hiring') || 
           $(this).find('h1, h2, h3, h4, h5, h6').length > 0 ||
           $(this).find('a[href*="/jobs/"], a[href*="/job/"]').length > 0;
  });
  
  if (jobCards.length === 0) {
    const possibleContainers = $('div, section, article').filter(function() {
      return $(this).find('a[href*="/jobs/"], a[href*="/job/"]').length > 0;
    });
    
    possibleContainers.each(function() {
      const jobLink = $(this).find('a[href*="/jobs/"], a[href*="/job/"]').first();
      if (jobLink.length) {
        jobCards.push(this);
      }
    });
  }
  
  jobCards.each(function() {
    const container = $(this);
    const titleEl = container.find('h1, h2, h3, h4, h5, h6').first();
    const title = titleEl.text().trim();
    
    if (!title) {
      const linkEl = container.find('a[href*="/jobs/"], a[href*="/job/"]').first();
      const linkText = linkEl.text().trim();
      const ariaLabel = linkEl.attr('aria-label') || '';
      title = linkText || ariaLabel;
    }
    
    if (!title || title.length < 2 || (title.length > 5 && !/[a-zA-Z]/.test(title))) {
      return;
    }
    
    const job = { title: title };
    
    const companyEl = container.find('[class*="company"], [class*="Company"], a[href*="/company"], span:not(:has(*))').filter(function() {
      return !$(this).text().trim().includes(title);
    }).first();
    
    job.companyName = companyEl.text().trim() || '';
    
    const locationEl = container.find('[class*="location"], [class*="Location"]').first();
    job.location = locationEl.text().trim() || '';
    
    const descEl = container.find('[class*="description"], [class*="Description"], [class*="desc"], [class*="summary"], p').first();
    job.description = descEl.text().trim() || '';
    
    const jobType = container.text().toLowerCase();
    if (jobType.includes('contract')) {
      job.jobType = 'contract';
    } else if (jobType.includes('part-time') || jobType.includes('part_time')) {
      job.jobType = 'part_time';
    } else if (jobType.includes('intern')) {
      job.jobType = 'internship';
    } else if (jobType.includes('remote')) {
      job.jobType = 'remote';
    } else if (jobType.includes('full-time') || jobType.includes('full_time')) {
      job.jobType = 'full_time';
    }
    
    const linkEl = container.find('a[href*="/jobs/"], a[href*="/job/"]').first();
    job.sourceUrl = linkEl.attr('href') ? new URL(linkEl.attr('href'), 'https://www.pbridgeco.com').href : '';
    
    result.push(job);
  });
  
  if (result.length === 0) {
    const allLinks = $('a[href*="/jobs/"], a[href*="/job/"]').filter(function() {
      return $(this).text().trim().length > 0;
    });
    
    allLinks.each(function() {
      const link = $(this);
      const linkText = link.text().trim();
      
      if (linkText.length < 3 || !/[a-zA-Z]{2,}/.test(linkText)) {
        return;
      }
      
      const job = {
        title: linkText,
        companyName: '',
        description: '',
        location: '',
        jobType: '',
        sourceUrl: new URL(link.attr('href'), 'https://www.pbridgeco.com').href
      };
      
      result.push(job);
    });
  }
});