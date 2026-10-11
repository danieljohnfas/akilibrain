var title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
if (title) {
  var description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
  var companyName = '';
  var location = '';
  if (description) {
    var compMatch = description.match(/^([^,]+?)\s+ni\s+kampuni/i);
    if (compMatch) {
      companyName = compMatch[1].trim();
    }
    var locMatch = description.match(/iliyopo\s+([^,]+),/i);
    if (locMatch) {
      location = locMatch[1].trim();
    }
  }
  var postedDateIsoString = $('meta[property="article:published_time"]').attr('content') || $('meta[property="og:updated_time"]').attr('content') || '';
  var sourceUrl = $('meta[property="og:url"]').attr('content') || '';
  var job = {
    title: title,
    companyName: companyName,
    description: description,
    location: location,
    sourceUrl: sourceUrl,
    postedDateIsoString: postedDateIsoString
  };
  result.push(job);
}