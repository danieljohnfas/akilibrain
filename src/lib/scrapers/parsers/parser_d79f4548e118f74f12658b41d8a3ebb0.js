const normalizeJobType = (typeText) => {
    if (!typeText) return null;
    const lowerType = typeText.toLowerCase().trim();
    if (lowerType.includes('full-time')) return 'full_time';
    if (lowerType.includes('part-time')) return 'part_time';
    if (lowerType.includes('contract')) return 'contract';
    if (lowerType.includes('internship')) return 'internship';
    if (lowerType.includes('remote')) return 'remote';
    return null;
};

const parseDateString = (dateText) => {
    if (!dateText) return null;
    let datePart = dateText.replace(/(Posted on|Apply before)\s*/i, '').trim();
    try {
        const date = new Date(datePart);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
    } catch (e) {
        // Invalid date string or parsing error
    }
    return null;
};

const jobCards = $('.grid.grid-cols-1.lg\\:grid-cols-2.gap-4.lg\\:gap-6.mt-4.md\\:mt-6 > .relative.bg-white.rounded-3xl.p-5.md\\:p-6.shadow-sm.ring-1.ring-slate-100.flex.flex-col.justify-between');

jobCards.each((index, element) => {
    const jobCard = $(element);

    const titleElement = jobCard.find('h2.font-extrabold a');
    const title = titleElement.text().trim();
    const sourceUrl = titleElement.attr('href');

    let companyName = null;
    let location = null;
    let postedDateIsoString = null;

    const companySvgPath = 'M3.75 21l6.935-1.565a4.5 4.5 0 013.834 0L20.25 21m-4.5-11.25v2.25m4.5-10.124v2.25m-4.5-7.125v2.25M18 10.5H12a2.25 2.25 0 00-2.25 2.25v5.25M7.5 10.5h6';
    const locationSvgPath = 'M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z';
    const dateSvgPath = 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z';

    jobCard.find('.text-sm.md\\:text-base.font-semibold.text-slate-600.mt-1.flex.items-center.gap-1\\.5').each((idx, el) => {
        const infoBlock = $(el);
        const svgPath = infoBlock.find('svg path').attr('d');
        const textSpan = infoBlock.find('span.inline-block.text-slate-700').text().trim();

        if (svgPath === companySvgPath) {
            companyName = textSpan;
        } else if (svgPath === locationSvgPath) {
            location = textSpan;
        } else if (svgPath === dateSvgPath && textSpan.startsWith('Posted on')) {
            postedDateIsoString = parseDateString(textSpan);
        }
    });

    const jobTypeSpan = jobCard.find('.mt-4.flex.flex-wrap.items-center.gap-2\\.5 span.inline-flex');
    const jobType = normalizeJobType(jobTypeSpan.text());

    const deadlineSpanContainer = jobCard.find('.mt-6.flex.items-center.justify-between .text-sm.font-semibold.text-slate-700 span.inline-block');
    let deadlineIsoString = null;
    if (deadlineSpanContainer.length && deadlineSpanContainer.text().includes('Apply before')) {
        deadlineIsoString = parseDateString(deadlineSpanContainer.text());
    }

    if (title) {
        result.push({
            title: title,
            companyName: companyName,
            description: null,
            location: location,
            jobType: jobType,
            sourceUrl: sourceUrl,
            postedDateIsoString: postedDateIsoString,
            deadlineIsoString: deadlineIsoString,
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: null,
        });
    }
});