const metaDescription = $('meta[name="description"]').attr('content');
const title = $('title').text();

if (metaDescription && metaDescription.includes('JOB VACANCY')) {
    const companyName = title.split(' at ')[1] || 'Kamanga Medics Hospital';
    const jobTitle = metaDescription.replace('JOB VACANCY ', '').split(' ' + companyName)[0].trim();
    const locationMatch = metaDescription.match(/located in ([^,]+)/);
    const location = locationMatch ? locationMatch[1] : 'Mwanza';

    result.push({
        title: jobTitle,
        companyName: companyName,
        description: metaDescription,
        location: location,
        sourceUrl: $('link[rel="canonical"]').attr('href') || window.location.href
    });
}