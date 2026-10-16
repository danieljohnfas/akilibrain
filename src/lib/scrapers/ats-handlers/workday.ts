import { fetchAtsApi } from '../../sources/ats-fetcher';
import { normalizeSector, extractAuthenticSkills } from '../skill-extractor';
import { createCountryResolver } from './country-resolver';
import { htmlToReadableText } from '../ingestion-standards';

export async function fetchWorkdayJobs(config: any) {
  try {
    const resolver = await createCountryResolver();

    const data = await fetchAtsApi(
      config.endpoint,
      "POST",
      {
        "Accept": "application/json"
      },
      { appliedFacets: {}, limit: 100, offset: 0, searchText: "" }
    );
    const postings = data?.jobPostings || [];
    if (postings.length === 0) return [];

    const parsedJobs = [];
    for (const req of postings) {
      const loc = req.locationsText || "";
      const title = req.title || "";
      const locCandidates = [loc, title].filter(Boolean).join(' ');

      const { countryId, location: resolvedLocation } = resolver.resolveLocationAndCountry(
        locCandidates,
        config.defaultCountryCode
      );

      if (!countryId) continue;

      const rawDesc = req.bulletFields?.join("\n") || "";
      const cleanDesc = htmlToReadableText(rawDesc) || "View full job description on company portal.";

      parsedJobs.push({
        title: req.title,
        companyName: config.companyName,
        description: cleanDesc,
        location: resolvedLocation,
        countryId: countryId,
        jobType: req.timeType?.includes("Part") ? "part_time" : "full_time",
        sourceUrl: `${config.siteUrl}${req.externalPath}`,
        employerUrl: config.employerUrl,
        postedDate: req.postedOn ? new Date(req.postedOn) : new Date(),
        deadline: null,
        isActive: true,
        sector: normalizeSector(config.sector, req.title),
        skills: extractAuthenticSkills(req.title, cleanDesc),
        needsAiExtraction: false
      });
    }

    return parsedJobs;
  } catch (error) {
    console.error(`[Workday Handler] Error fetching jobs for ${config.companyName}:`, error);
    return [];
  }
}
