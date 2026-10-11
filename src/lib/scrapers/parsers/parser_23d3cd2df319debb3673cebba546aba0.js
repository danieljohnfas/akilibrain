let postingMap = {};
let itemList = [];

$('script[type="application/ld+json"]').each((_, script) => {
    const data = $(script).html();
    if (!data) return;
    let parsed;
    try {
        parsed = JSON.parse(data);
    } catch (e) {
        return;
    }

    function walk(node, map, items) {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) {
            for (const elem of node) walk(elem, map, items);
            return;
        }
        const type = node['@type'];
        if (type === 'JobPosting') {
            const url = node.url || node['@id'];
            if (url) map[url] = node;
        } else if (type === 'ItemList' && Array.isArray(node.itemListElement)) {
            for (const it of node.itemListElement) {
                if (it['@type'] === 'ListItem') items.push(it);
            }
        }
        for (const key in node) {
            if (key !== '@type' && typeof node[key] === 'object') {
                walk(node[key], map, items);
            }
        }
    }

    walk(parsed, postingMap, itemList);
});

for (const elem of itemList) {
    const job = {};
    if (elem.name) job.title = elem.name.trim();
    const url = elem.url;
    if (url) job.sourceUrl = url;
    const posting = postingMap[url];
    if (posting) {
        if (posting.title && !job.title) job.title = posting.title;
        if (posting.description) job.description = posting.description;
        if (posting.hiringOrganization && posting.hiringOrganization.name) job.companyName = posting.hiringOrganization.name;
        if (posting.address) {
            const addr = posting.address;
            let loc = '';
            if (addr.city) loc = addr.city;
            else if (addr.addressLocality) loc = addr.addressLocality;
            if (loc) job.location = loc;
        }
        if (posting.jobType) job.jobType = posting.jobType;
        if (posting.datePosted) job.postedDateIsoString = posting.datePosted;
        if (posting.validThrough) job.deadlineIsoString = posting.validThrough;
        const baseSalary = posting.baseSalary;
        if (baseSalary && baseSalary.value) {
            const val = baseSalary.value;
            if (val.minValue !== undefined) job.salaryMin = val.minValue;
            if (val.maxValue !== undefined) job.salaryMax = val.maxValue;
            if (baseSalary.currency) job.salaryCurrency = baseSalary.currency;
        }
    }
    if (job.title) result.push(job);
}