import { fetchAtsApi } from '../../sources/ats-fetcher';
import { normalizeSector, extractAuthenticSkills } from '../skill-extractor';
import { createCountryResolver } from './country-resolver';

export async function fetchPinpointJobs(config: any) {
  try {
    const resolver = await createCountryResolver();

    const subdomain = config.subdomain || config.boardToken;
    const endpoint = config.endpoint || `https://${subdomain}.pinpointhq.com/postings.json`;
    const data = await fetchAtsApi(endpoint);
    const jobsList = data?.data || data || [];

    if (!Array.isArray(jobsList) || jobsList.length === 0) return [];

    const companyName = config.companyName || config.company;
    const defaultEmployerUrl = config.employerUrl || `https://${subdomain}.pinpointhq.com`;

    const parsedJobs = [];
    for (const req of jobsList) {
      const locString = `${req.location?.name || ''} ${req.location?.city || ''} ${req.location?.country || ''}`;
      const countryCode = req.location?.country_code || config.defaultCountryCode;
      const countryId = resolver.resolveCountryId(locString, countryCode);

      if (!countryId) continue;

      let jobType = 'full_time';
      const empType = (req.employment_type || req.employment_type_text || '').toLowerCase();
      if (empType.includes('part')) jobType = 'part_time';
      if (empType.includes('contract') || empType.includes('temp')) jobType = 'contract';
      if (empType.includes('intern')) jobType = 'internship';

      const fullDesc = [
        req.description || '',
        req.key_responsibilities ? `\n\nKey Responsibilities:\n${req.key_responsibilities}` : '',
        req.benefits ? `\n\nBenefits:\n${req.benefits}` : ''
      ].join('').trim() || 'View full job description on company portal.';

      const requirements = req.skills_knowledge_expertise || '';

      const jobSector = normalizeSector(config.sector || req.job?.department?.name, req.title);
      const jobSkills = extractAuthenticSkills(req.title, `${requirements} ${fullDesc}`);

      parsedJobs.push({
        title: req.title,
        companyName: companyName,
        description: fullDesc,
        requirements: requirements,
        countryId: countryId,
        jobType: jobType as any,
        sourceUrl: req.url || defaultEmployerUrl,
        employerUrl: req.url || defaultEmployerUrl,
        postedDate: new Date(),
        deadline: req.deadline_at ? new Date(req.deadline_at) : null,
        isActive: true,
        sector: jobSector,
        skills: jobSkills,
        needsAiExtraction: false
      });
    }

    return parsedJobs;
  } catch (error) {
    console.error(`[Pinpoint Handler] Error fetching jobs for ${config.companyName}:`, error);
    return [];
  }
}
