import { fetchAtsApi } from '../../sources/ats-fetcher';
import { normalizeSector, extractAuthenticSkills } from '../skill-extractor';
import { createCountryResolver } from './country-resolver';
import { htmlToReadableText } from '../ingestion-standards';

export async function fetchAshbyJobs(config: any) {
  try {
    const resolver = await createCountryResolver();

    const boardToken = config.boardToken || config.boardName;
    const endpoint = `https://api.ashbyhq.com/posting-api/job-board/${boardToken}`;
    const data = await fetchAtsApi(endpoint);
    const jobsList = data?.jobs || [];

    if (jobsList.length === 0) return [];

    const companyName = config.companyName || config.company;
    const employerUrl = config.employerUrl || `https://jobs.ashbyhq.com/${boardToken}`;

    const parsedJobs = [];
    for (const req of jobsList) {
      const locCandidates = [req.location, req.title].filter(Boolean).join(' ');
      const { countryId, location: resolvedLocation } = resolver.resolveLocationAndCountry(
        locCandidates,
        config.defaultCountryCode,
      );

      if (!countryId) continue;

      let jobType = 'full_time';
      const empType = (req.employmentType || '').toLowerCase();
      if (empType.includes('part')) jobType = 'part_time';
      if (empType.includes('contract') || empType.includes('temp')) jobType = 'contract';
      if (empType.includes('intern')) jobType = 'internship';

      const jobSector = normalizeSector(config.sector, req.title);
      const cleanDesc = htmlToReadableText(req.descriptionPlain || req.description || '') || 'View full description on company portal.';
      const jobSkills = extractAuthenticSkills(req.title, cleanDesc);

      parsedJobs.push({
        title: req.title,
        companyName: companyName,
        description: cleanDesc,
        location: resolvedLocation,
        countryId: countryId,
        jobType: jobType as any,
        sourceUrl: req.jobUrl || `https://jobs.ashbyhq.com/${boardToken}/${req.id}`,
        employerUrl: employerUrl,
        postedDate: req.publishedAt ? new Date(req.publishedAt) : new Date(),
        deadline: null,
        isActive: true,
        sector: jobSector,
        skills: jobSkills,
        needsAiExtraction: false
      });
    }

    return parsedJobs;
  } catch (error) {
    console.error(`[Ashby Handler] Error fetching jobs for ${config.companyName}:`, error);
    return [];
  }
}
