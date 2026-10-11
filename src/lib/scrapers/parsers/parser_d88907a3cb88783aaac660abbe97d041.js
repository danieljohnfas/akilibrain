const title = $("title").text().trim();
const companyName = "Citibank Tanzania Ltd";
const description = "";
const location = "";
const jobType = "";
const sourceUrl = $("link[rel=canonical]").attr("href");
const postedDateIsoString = $("meta[property=article:published_time]").attr("content");
const deadlineIsoString = "";
const salaryMin = 0;
const salaryMax = 0;
const salaryCurrency = "";
result.push({
  title,
  companyName,
  description,
  location,
  jobType,
  sourceUrl,
  postedDateIsoString,
  deadlineIsoString,
  salaryMin,
  salaryMax,
  salaryCurrency
});