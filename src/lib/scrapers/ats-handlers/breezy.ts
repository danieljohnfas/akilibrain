import { fetchAtsApi } from '../../sources/ats-fetcher';
import { normalizeSector, extractAuthenticSkills } from '../skill-extractor';
import { createCountryResolver } from './country-resolver';

export async function fetchBreezyJobs(config: any) {
  try {
    const resolver = await createCountryResolver();

    const subdomain = config.subdomain || config.accountName || config.boardToken;
    const companyName = config.companyName || config.company;
    const employerUrl = config.employerUrl || `https://${subdomain}.breezy.hr`;

    const endpoint = config.endpoint || `https://${subdomain}.breezy.hr/json`;
    const jobsList = await fetchAtsApi(endpoint);

    if (!Array.isArray(jobsList) || jobsList.length === 0) return [];

    const parsedJobs = [];

    for (const req of jobsList) {
      const locCountry = req.location?.country?.name || '';
      const locCity = req.location?.city || '';
      const countryCode = req.location?.country?.id || config.defaultCountryCode || config.country;
      const locString = `${locCountry} ${locCity} ${req.location?.name || ''}`;

      const { countryId, location: resolvedLocation } = resolver.resolveLocationAndCountry(locString, countryCode);
      if (!countryId) continue;

      const jobTitle = req.name || req.title;
      const department = req.department || '';
      const jobUrl = req.url || `https://${subdomain}.breezy.hr/p/${req.friendly_id || req.id}`;

      const description = `Role: ${jobTitle} at ${companyName}.\nDepartment: ${department || 'General'}\nLocation: ${resolvedLocation}.\nEmployment Type: ${req.type?.name || 'Full-Time'}`;
      
      const cleanedSkills = extractAuthenticSkills(jobTitle, `${jobTitle} ${department} ${description}`);

      parsedJobs.push({
        title: jobTitle,
        companyName: companyName,
        description: description.substring(0, 8000),
        location: resolvedLocation,
        countryId: countryId,
        jobType: "full_time",
        sourceUrl: jobUrl,
        employerUrl: employerUrl,
        postedDate: req.published_date ? new Date(req.published_date) : new Date(),
        deadline: null,
        isActive: true,
        sector: normalizeSector(config.sector, jobTitle),
        skills: cleanedSkills,
        needsAiExtraction: false
      });
    }

    return parsedJobs;
  } catch (error) {
    console.error(`[Breezy Handler] Error fetching jobs for ${config.companyName}:`, error);
    return [];
  }
}
