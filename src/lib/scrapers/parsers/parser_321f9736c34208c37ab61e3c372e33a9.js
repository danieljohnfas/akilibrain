$('script[type="application/ld+json"]').each((_, script) => {
    try {
        const data = JSON.parse($(script).html());
        const items = Array.isArray(data) ? data : [data];
        items.forEach(d => {
            if (d['@type'] === 'SearchResultsPage' && d.mainEntity && d.mainEntity.itemListElement) {
                d.mainEntity.itemListElement.forEach(elem => {
                    const it = elem.item || {};
                    const job = {};
                    if (it.name) job.title = it.name.trim();
                    if (it.url) job.sourceUrl = it.url;
                    if (Object.keys(job).length) result.push(job);
                });
            }
        });
    } catch (e) {}
});