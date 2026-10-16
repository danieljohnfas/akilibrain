import { fetchAtsApi } from '../../sources/ats-fetcher';
import { normalizeSector, extractAuthenticSkills } from '../skill-extractor';
import { createCountryResolver } from './country-resolver';
import { htmlToReadableText } from '../ingestion-standards';

export async function fetchGreenhouseJobs(config: any) {
  try {
    const resolver = await createCountryResolver();

    const endpoint = `https://boards-api.greenhouse.io/v1/boards/${config.boardToken}/jobs?content=true`;
    const data = await fetchAtsApi(endpoint);
    const jobsList = data?.jobs || [];
    
    if (jobsList.length === 0) return [];

    const companyName = config.companyName || config.company;
    const employerUrl = config.employerUrl || `https://boards.greenhouse.io/${config.boardToken}`;

    const parsedJobs = [];
    for (const req of jobsList) {
      const locCandidates = [req.location?.name, req.title].filter(Boolean).join(' ');
      const fallbackCountryCode = config.defaultCountryCode || (config.country ? config.country.substring(0, 2).toUpperCase() : null);
      const { countryId, location: resolvedLocation } = resolver.resolveLocationAndCountry(locCandidates, fallbackCountryCode);

      if (!countryId) continue;

      const cleanDesc = htmlToReadableText(req.content || '') || 'View full description on company portal.';

      parsedJobs.push({
        title: req.title,
        companyName: companyName,
        description: cleanDesc.substring(0, 8000),
        location: resolvedLocation,
        countryId: countryId,
        jobType: 'full_time',
        sourceUrl: req.absolute_url,
        employerUrl: employerUrl,
        postedDate: req.updated_at ? new Date(req.updated_at) : new Date(),
        deadline: null,
        isActive: true,
        sector: normalizeSector(config.sector, req.title),
        skills: extractAuthenticSkills(req.title, cleanDesc),
        needsAiExtraction: false
      });
    }

    return parsedJobs;
  } catch (error) {
    console.error(`[Greenhouse Handler] Error fetching jobs for ${config.companyName}:`, error);
    return [];
  }
}
