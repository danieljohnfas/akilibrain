let $jobElems = $('.job-listing, .job-card, article.job');
if ($jobElems.length) {
    $jobElems.each(function(i, el) {
        const $el = $(el);
        const title = $el.find('.title, h2, h3').eq(0).text().trim();
        if (!title) return;
        const job = { title };
        result.push(job);
    });
}