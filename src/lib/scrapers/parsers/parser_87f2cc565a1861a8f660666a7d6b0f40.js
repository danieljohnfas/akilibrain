var scriptContent = $('script[type="application/ld+json"]').text();
if (scriptContent) {
    try {
        var ldJson = JSON.parse(scriptContent);
        var itemList = null;

        if (Array.isArray(ldJson['@graph'])) {
            for (var i = 0; i < ldJson['@graph'].length; i++) {
                if (ldJson['@graph'][i]['@type'] === 'ItemList' && ldJson['@graph'][i]['name'] && ldJson['@graph'][i]['name'].includes('Jobs')) {
                    itemList = ldJson['@graph'][i];
                    break;
                }
            }
        } else if (ldJson['@type'] === 'ItemList' && ldJson['name'] && ldJson['name'].includes('Jobs')) {
            itemList = ldJson;
        }

        if (itemList && Array.isArray(itemList.itemListElement)) {
            itemList.itemListElement.forEach(function(item) {
                if (item['@type'] === 'ListItem' && item.name && item.url) {
                    var job = {
                        title: item.name,
                        sourceUrl: item.url
                    };
                    result.push(job);
                }
            });
        }
    } catch (e) {
        // JSON parsing error, result remains empty.
    }
}