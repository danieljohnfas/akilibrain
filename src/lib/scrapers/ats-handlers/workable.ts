import { fetchAtsApi } from '../../sources/ats-fetcher';
import { normalizeSector, extractAuthenticSkills } from '../skill-extractor';
import { createCountryResolver } from './country-resolver';

export async function fetchWorkableJobs(config: any) {
  try {
    const resolver = await createCountryResolver();

    const account = config.accountName || config.subdomain || config.boardToken;
    const companyName = config.companyName || config.company;
    const employerUrl = config.employerUrl || `https://apply.workable.com/${account}`;

    const listEndpoint = `https://apply.workable.com/api/v3/accounts/${account}/jobs`;
    const listData = await fetchAtsApi(listEndpoint, "POST", undefined, {});
    const jobsList = listData?.results || [];

    if (!Array.isArray(jobsList) || jobsList.length === 0) return [];

    const parsedJobs = [];

    for (const req of jobsList) {
      const locString = `${req.location?.country || ''} ${req.location?.city || ''} ${req.location?.region || ''}`;
      const countryCode = req.location?.countryCode || config.defaultCountryCode || config.country;
      const countryId = resolver.resolveCountryId(locString, countryCode);

      if (!countryId) continue; // Skip non-target country jobs

      // Fetch full details for job description and requirements
      let fullDescription = "";
      let fullRequirements = "";

      try {
        const detailEndpoint = `https://apply.workable.com/api/v2/accounts/${account}/jobs/${req.shortcode}`;
        const detail = await fetchAtsApi(detailEndpoint);
        if (detail) {
          fullDescription = detail.description || "";
          fullRequirements = detail.requirements || "";
        }
      } catch (e) {
        // Fallback gracefully
        fullDescription = `Position: ${req.title} at ${companyName}.`;
      }

      const combinedText = `${fullDescription} ${fullRequirements}`;
      const cleanedSkills = extractAuthenticSkills(req.title, combinedText);

      parsedJobs.push({
        title: req.title,
        companyName: companyName,
        description: (fullDescription + (fullRequirements ? "\n\nRequirements:\n" + fullRequirements : "")).substring(0, 8000),
        countryId: countryId,
        jobType: "full_time",
        sourceUrl: req.url || `https://apply.workable.com/${account}/j/${req.shortcode}/`,
        employerUrl: employerUrl,
        postedDate: req.published ? new Date(req.published) : new Date(),
        deadline: null,
        isActive: true,
        sector: normalizeSector(config.sector, req.title),
        skills: cleanedSkills,
        needsAiExtraction: false
      });
    }

    return parsedJobs;
  } catch (error) {
    console.error(`[Workable Handler] Error fetching jobs for ${config.companyName}:`, error);
    return [];
  }
}
