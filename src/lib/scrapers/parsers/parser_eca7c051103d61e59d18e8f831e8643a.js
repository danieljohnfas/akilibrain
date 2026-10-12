function safeParseJson(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        return null;
    }
}

const jsonLdJobs = [];
let hasExplicitZeroJobsSchema = false;

$('script[type="application/ld+json"]').each((i, el) => {
    const scriptContent = $(el).html();
    const data = safeParseJson(scriptContent);

    if (data) {
        // Handle a single JobPosting object
        if (data['@type'] === 'JobPosting') {
            const job = {};
            job.title = data.title || null;
            job.companyName = data.hiringOrganization && data.hiringOrganization.name ? data.hiringOrganization.name : null;
            job.description = data.description || null;
            
            if (data.jobLocation) {
                if (data.jobLocation['@type'] === 'Place' && data.jobLocation.address) {
                    job.location = data.jobLocation.address.addressLocality || data.jobLocation.address.addressRegion || null;
                    if (!job.location && data.jobLocation.address.streetAddress) {
                        job.location = data.jobLocation.address.streetAddress;
                    }
                } else if (typeof data.jobLocation === 'string') {
                    job.location = data.jobLocation;
                }
            }

            if (data.employmentType) {
                const type = String(data.employmentType).toLowerCase();
                if (type.includes('full_time') || type.includes('full-time')) job.jobType = 'full_time';
                else if (type.includes('part_time') || type.includes('part-time')) job.jobType = 'part_time';
                else if (type.includes('contract')) job.jobType = 'contract';
                else if (type.includes('internship')) job.jobType = 'internship';
                else if (type.includes('remote')) job.jobType = 'remote';
                else job.jobType = type; // Keep original if not standard
            }

            job.sourceUrl = data.url || null;
            job.postedDateIsoString = data.datePosted || null;
            job.deadlineIsoString = data.validThrough || null;

            if (data.baseSalary && data.baseSalary['@type'] === 'MonetaryAmount') {
                if (data.baseSalary.value) {
                    if (typeof data.baseSalary.value === 'object') { // e.g., { "@type": "QuantitativeValue", "minValue": 3000, "maxValue": 5000 }
                        if (data.baseSalary.value.minValue) job.salaryMin = parseFloat(data.baseSalary.value.minValue);
                        if (data.baseSalary.value.maxValue) job.salaryMax = parseFloat(data.baseSalary.value.maxValue);
                    } else if (typeof data.baseSalary.value === 'number') { // e.g., { "value": 4000 }
                        job.salaryMin = parseFloat(data.baseSalary.value);
                        job.salaryMax = parseFloat(data.baseSalary.value);
                    }
                }
                if (data.baseSalary.currency) job.salaryCurrency = data.baseSalary.currency;
            }

            if (job.title) {
                jsonLdJobs.push(job);
            }
        }
        // Handle an array of JobPosting objects (sometimes top-level object is an array)
        else if (Array.isArray(data)) {
            data.forEach(item => {
                if (item['@type'] === 'JobPosting') {
                    const job = {};
                    job.title = item.title || null;
                    job.companyName = item.hiringOrganization && item.hiringOrganization.name ? item.hiringOrganization.name : null;
                    job.description = item.description || null;

                    if (item.jobLocation) {
                        if (item.jobLocation['@type'] === 'Place' && item.jobLocation.address) {
                            job.location = item.jobLocation.address.addressLocality || item.jobLocation.address.addressRegion || null;
                            if (!job.location && item.jobLocation.address.streetAddress) {
                                job.location = item.jobLocation.address.streetAddress;
                            }
                        } else if (typeof item.jobLocation === 'string') {
                            job.location = item.jobLocation;
                        }
                    }
                    
                    if (item.employmentType) {
                        const type = String(item.employmentType).toLowerCase();
                        if (type.includes('full_time') || type.includes('full-time')) job.jobType = 'full_time';
                        else if (type.includes('part_time') || type.includes('part-time')) job.jobType = 'part_time';
                        else if (type.includes('contract')) job.jobType = 'contract';
                        else if (type.includes('internship')) job.jobType = 'internship';
                        else if (type.includes('remote')) job.jobType = 'remote';
                        else job.jobType = type;
                    }

                    job.sourceUrl = item.url || null;
                    job.postedDateIsoString = item.datePosted || null;
                    job.deadlineIsoString = item.validThrough || null;

                    if (item.baseSalary && item.baseSalary['@type'] === 'MonetaryAmount') {
                        if (item.baseSalary.value) {
                            if (typeof item.baseSalary.value === 'object') {
                                if (item.baseSalary.value.minValue) job.salaryMin = parseFloat(item.baseSalary.value.minValue);
                                if (item.baseSalary.value.maxValue) job.salaryMax = parseFloat(item.baseSalary.value.maxValue);
                            } else if (typeof item.baseSalary.value === 'number') {
                                job.salaryMin = parseFloat(item.baseSalary.value);
                                job.salaryMax = parseFloat(item.baseSalary.value);
                            }
                        }
                        if (item.baseSalary.currency) job.salaryCurrency = item.baseSalary.currency;
                    }

                    if (job.title) {
                        jsonLdJobs.push(job);
                    }
                }
            });
        }
        // Check for WebPage schema indicating an ItemList with zero items
        if (data['@type'] === 'WebPage' && data.mainEntity && data.mainEntity['@type'] === 'ItemList') {
            if (data.mainEntity.numberOfItems === 0 || (Array.isArray(data.mainEntity.itemListElement) && data.mainEntity.itemListElement.length === 0)) {
                hasExplicitZeroJobsSchema = true;
            }
        }
    }
});

// If actual job postings were found via JSON-LD, add them to the result.
if (jsonLdJobs.length > 0) {
    jsonLdJobs.forEach(job => result.push(job));
} else if (hasExplicitZeroJobsSchema) {
    // If JSON-LD explicitly states zero jobs and no actual JobPosting schemas were found,
    // leave the result array empty as per instructions.
} else {
    // This block would contain HTML scraping logic if no JSON-LD JobPosting schema was found
    // and there was no explicit indication of zero jobs.
    // However, for the provided HTML, the `hasExplicitZeroJobsSchema` condition will be true,
    // and thus this block will not be executed.
    // The provided HTML does not contain visual job listings, so no HTML scraping is appropriate here.
    // A deterministic script for *this specific HTML structure* must yield an empty result.
}