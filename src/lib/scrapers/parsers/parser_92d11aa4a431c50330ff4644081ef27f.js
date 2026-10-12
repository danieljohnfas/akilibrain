const cleanText = (text) => text ? text.replace(/\s+/g, ' ').trim() : '';

let companyName = '';
const ogTitle = $('meta[property="og:title"]').attr('content');
if (ogTitle) {
    const match = ogTitle.match(/New Vacancies At (.+?),/i);
    if (match && match[1]) {
        companyName = cleanText(match[1]);
    } else {
        const titleTag = $('title').text();
        const titleMatch = titleTag.match(/New Vacancies At (.+?),/i);
        if (titleMatch && titleMatch[1]) {
            companyName = cleanText(titleMatch[1]);
        }
    }
}
if (!companyName) {
    const mainContentHeading = $('h1.post-title').text();
    if (mainContentHeading) {
        const headingMatch = mainContentHeading.match(/New Vacancies At (.+?),/i);
        if (headingMatch && headingMatch[1]) {
            companyName = cleanText(headingMatch[1]);
        }
    }
}
if (!companyName) {
    const articleIntro = $('.penci-entry-content.entry-content').find('p').first().text();
    if (articleIntro) {
        const introMatch = articleIntro.match(/(.+?) Vacancies/i);
        if (introMatch && introMatch[1]) {
            companyName = cleanText(introMatch[1]);
        }
    }
}

const sourceUrl = $('link[rel="canonical"]').attr('href') || '';

const postedDateIsoString = $('meta[property="article:published_time"]').attr('content') || '';

let deadlineIsoString = '';
const contentDivText = cleanText($('.penci-entry-content.entry-content').text());
const deadlineMatch = contentDivText.match(/APPLICATION DEADLINE:\s*(\d{1,2} \w+ \d{4})/i);

if (deadlineMatch && deadlineMatch[1]) {
    const dateString = deadlineMatch[1];
    let parsedDate = new Date(dateString);

    if (!isNaN(parsedDate.getTime())) {
        deadlineIsoString = parsedDate.toISOString().split('T')[0] + 'T00:00:00Z';
    } else {
        try {
            const parts = dateString.split(' ');
            const day = parseInt(parts[0], 10);
            const monthName = parts[1];
            const year = parseInt(parts[2], 10);
            const monthNames = {
                'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5,
                'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
            };
            const month = monthNames[monthName];
            if (month !== undefined && !isNaN(day) && !isNaN(year)) {
                const date = new Date(Date.UTC(year, month, day));
                if (!isNaN(date.getTime())) {
                    deadlineIsoString = date.toISOString().split('T')[0] + 'T00:00:00Z';
                }
            }
        } catch (e) {}
    }
}

let location = companyName.includes('Mbeya') ? 'Mbeya, Tanzania' : 'Tanzania';

$('.penci-entry-content.entry-content ul li').each((index, element) => {
    const li = $(element);
    const strongElement = li.find('strong');
    let jobTitleRaw = cleanText(strongElement.text());

    const titleMatch = jobTitleRaw.match(/Position \d+:\s*(.+)/i);
    if (titleMatch && titleMatch[1]) {
        const jobTitle = cleanText(titleMatch[1]);

        let description = cleanText(li.text());
        description = description.replace(jobTitleRaw, '').trim();

        result.push({
            title: jobTitle,
            companyName: companyName,
            description: description || null,
            location: location || null,
            jobType: '',
            sourceUrl: sourceUrl || null,
            postedDateIsoString: postedDateIsoString || null,
            deadlineIsoString: deadlineIsoString || null,
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: ''
        });
    }
});