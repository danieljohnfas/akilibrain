import { fetchAtsApi } from '../../sources/ats-fetcher';
import { normalizeSector, extractAuthenticSkills } from '../skill-extractor';
import { createCountryResolver } from './country-resolver';
import { htmlToReadableText } from '../ingestion-standards';

export async function fetchOracleJobs(config: any) {
  try {
    const resolver = await createCountryResolver();

    const data = await fetchAtsApi(config.endpoint);
    const rawJobs = data?.items?.[0]?.requisitionList || [];
    
    if (rawJobs.length === 0) return [];

    const parsedJobs = [];
    for (const req of rawJobs) {
      const loc = req.PrimaryLocation || "";
      const locCountry = req.PrimaryLocationCountry || "";
      const title = req.Title || "";
      
      const locCandidates = [loc, locCountry, title].filter(Boolean).join(' ');
      const fallbackCountryCode = locCountry || config.defaultCountryCode;
      const { countryId, location: resolvedLocation } = resolver.resolveLocationAndCountry(locCandidates, fallbackCountryCode);
      
      if (!countryId) continue;

      // Construct dynamic URL from endpoint domain
      const url = new URL(config.endpoint);
      const host = url.origin;
      const siteNumberMatch = config.endpoint.match(/siteNumber=([^,]+)/);
      const siteNumber = siteNumberMatch ? siteNumberMatch[1] : 'CX_3001';

      const cleanDesc = htmlToReadableText(req.ShortDescriptionStr || req.Description || '') || "View full job description on company portal.";

      parsedJobs.push({
        title: req.Title,
        companyName: config.companyName,
        description: cleanDesc,
        location: resolvedLocation,
        countryId: countryId,
        jobType: "full_time", // Default
        sourceUrl: `${host}/hcmUI/CandidateExperience/en/sites/${siteNumber}/job/${req.Id}`,
        employerUrl: config.employerUrl,
        postedDate: req.PostedDate ? new Date(req.PostedDate) : new Date(),
        deadline: req.PostingEndDate ? new Date(req.PostingEndDate) : null,
        isActive: true,
        sector: normalizeSector(config.sector, req.Title),
        skills: extractAuthenticSkills(req.Title, cleanDesc),
        needsAiExtraction: false
      });
    }

    return parsedJobs;
  } catch (error) {
    console.error(`[Oracle Handler] Error fetching jobs for ${config.companyName}:`, error);
    return [];
  }
}
