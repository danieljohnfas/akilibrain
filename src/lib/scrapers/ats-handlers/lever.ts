import { fetchAtsApi } from '../../sources/ats-fetcher';
import { normalizeSector, extractAuthenticSkills } from '../skill-extractor';
import { createCountryResolver } from './country-resolver';

export async function fetchLeverJobs(config: any) {
  try {
    const resolver = await createCountryResolver();

    const accountName = config.accountName || config.boardToken;
    const companyName = config.companyName || config.company;
    const employerUrl = config.employerUrl || `https://jobs.lever.co/${accountName}`;

    const endpoint = `https://api.lever.co/v0/postings/${accountName}?mode=json`;
    const data = await fetchAtsApi(endpoint);
    // Lever returns an array of postings directly
    const jobsList = Array.isArray(data) ? data : [];
    
    if (jobsList.length === 0) return [];

    const parsedJobs = [];
    for (const req of jobsList) {
      const loc = req.categories?.location || "";
      const countryId = resolver.resolveCountryId(loc, config.defaultCountryCode || config.country);

      if (!countryId) continue; 

      parsedJobs.push({
        title: req.text,
        companyName: companyName,
        description: req.descriptionPlain || req.description,
        countryId: countryId,
        jobType: "full_time",
        sourceUrl: req.hostedUrl,
        employerUrl: employerUrl,
        postedDate: req.createdAt ? new Date(req.createdAt) : new Date(),
        deadline: null,
        isActive: true,
        sector: normalizeSector(config.sector, req.text),
        skills: extractAuthenticSkills(req.text, req.descriptionPlain || req.description),
        needsAiExtraction: false
      });
    }

    return parsedJobs;
  } catch (error) {
    console.error(`[Lever Handler] Error fetching jobs for ${config.companyName}:`, error);
    return [];
  }
}
