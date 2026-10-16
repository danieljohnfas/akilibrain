import { fetchAtsApi } from '../../sources/ats-fetcher';
import { normalizeSector, extractAuthenticSkills } from '../skill-extractor';
import { createCountryResolver } from './country-resolver';

export async function fetchSmartRecruitersJobs(config: any) {
  try {
    const resolver = await createCountryResolver();

    const endpoint = `https://api.smartrecruiters.com/v1/companies/${config.companyId}/postings`;
    const data = await fetchAtsApi(endpoint);
    const jobsList = data?.content || [];
    
    if (jobsList.length === 0) return [];

    const parsedJobs = [];
    for (const req of jobsList) {
      const locCountry = req.location?.country || "";
      const locCity = req.location?.city || "";
      const locRegion = req.location?.region || "";
      const locString = `${locCountry} ${locCity} ${locRegion}`;

      const { countryId, location: resolvedLocation } = resolver.resolveLocationAndCountry(locString, locCountry);
      if (!countryId) continue; 

      parsedJobs.push({
        title: req.name,
        companyName: config.companyName,
        description: `Role: ${req.name} based in ${resolvedLocation}.\nEmployer: ${config.companyName}.\nView full description and requirements on the company portal.`,
        location: resolvedLocation,
        countryId: countryId,
        jobType: "full_time",
        sourceUrl: `https://jobs.smartrecruiters.com/${config.companyId}/${req.id}`,
        employerUrl: config.employerUrl,
        postedDate: req.releasedDate ? new Date(req.releasedDate) : new Date(),
        deadline: null,
        isActive: true,
        sector: normalizeSector(config.sector, req.name),
        skills: extractAuthenticSkills(req.name, `${locCity} ${req.name}`),
        needsAiExtraction: false
      });
    }

    return parsedJobs;
  } catch (error) {
    console.error(`[SmartRecruiters Handler] Error fetching jobs for ${config.companyName}:`, error);
    return [];
  }
}
