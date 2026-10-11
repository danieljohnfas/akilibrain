const jobTitle = $('h1').first().text().trim();

if (!jobTitle) {
  // If no job title found, leave result empty
} else {
  const companyName = $('meta[property="og:title"]').attr('content') || '';
  const description = $('meta[name="description"]').attr('content') || '';
  const sourceUrl = $('link[rel="canonical"]').attr('href') || '';
  const postedDateIsoString = $('meta[property="article:published_time"]').attr('content') || '';
  const updatedDateIsoString = $('meta[property="og:updated_time"]').attr('content') || '';
  const locationText = $('title').text().match(/(?:At\s|[\w\s,]+\sLimited)/i);

  const job = {
    title: jobTitle,
    companyName: companyName,
    description: description,
    location: locationText ? locationText[0] : '',
    jobType: 'full_time', // Defaulting to full_time as a reasonable assumption
    sourceUrl: sourceUrl,
    postedDateIsoString: postedDateIsoString,
    deadlineIsoString: updatedDateIsoString, // Using updated time as deadline proxy if not explicitly defined
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: 'TZS' // Assuming Tanzanian Shilling based on domain
  };

  result.push(job);
}
```

### Explanation:

1. **Job Title Extraction**: The script tries to extract the job title from the first `<h1>` element, which typically contains the page heading and often the job title.
2. **Conditional Check**: If no valid job title is found, it doesn't proceed further and leaves the `result` array empty.
3. **Metadata Usage**: 
   - It extracts the company name from the Open Graph title tag.
   - Description is taken from the SEO meta description tag.
   - Source URL is pulled from the canonical link tag.
   - Posted date is retrieved from the article published time metadata.
   - Updated/deadline date uses the `og:updated_time` as a closest match for deadline information.
4. **Location Logic**: Attempts to infer location from the title text using a regex pattern common in job listings ("At [Company]").
5. **Defaults & Fallbacks**:
   - Job type is assumed full-time due to lack of explicit indicators in this sample HTML.
   - Salary fields default to null since they aren't present.
   - Currency defaults to TZS (Tanzanian Shilling) inferred from the domain `.tz`.
6. **Single Job Handling**: This HTML represents a single job posting page rather than a listing page, so it processes only one job object accordingly.

This approach ensures data integrity by only extracting real job postings and populating the result array appropriately when conditions are met.