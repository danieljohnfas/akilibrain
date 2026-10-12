import { db } from '../../db/client';
import { countries } from '../../db/schema/shared';
import { inArray } from 'drizzle-orm';
import { fetchAtsApi } from '../../sources/ats-fetcher';
import { normalizeSector, extractAuthenticSkills } from '../skill-extractor';

export async function fetchAshbyJobs(config: any) {
  try {
    const targetCountries = ["Kenya", "Tanzania", "Uganda", "Rwanda", "Ghana", "Nigeria", "Zambia", "South Africa", "Ethiopia"];
    const dbCountries = await db.select().from(countries).where(inArray(countries.name, targetCountries));

    const countryMap = new Map<string, string>();
    for (const c of dbCountries) {
      countryMap.set(c.name.toLowerCase(), c.id);
    }

    const boardToken = config.boardToken || config.boardName;
    const endpoint = `https://api.ashbyhq.com/posting-api/job-board/${boardToken}`;
    const data = await fetchAtsApi(endpoint);
    const jobsList = data?.jobs || [];

    if (jobsList.length === 0) return [];

    const companyName = config.companyName || config.company;
    const employerUrl = config.employerUrl || `https://jobs.ashbyhq.com/${boardToken}`;

    const parsedJobs = [];
    for (const req of jobsList) {
      let countryId = null;

      const loc = (req.location || "").toLowerCase();
      const desc = (req.descriptionPlain || req.description || "").toLowerCase();

      // Check location text against supported countries
      for (const [name, id] of countryMap.entries()) {
        if (loc.includes(name)) {
          countryId = id;
          break;
        }
      }

      // Check common African cities if country not explicitly named in location
      if (!countryId) {
        if (loc.includes('nairobi') || loc.includes('mombasa') || loc.includes('kisumu')) countryId = countryMap.get('kenya');
        else if (loc.includes('lagos') || loc.includes('abuja') || loc.includes('epe')) countryId = countryMap.get('nigeria');
        else if (loc.includes('accra') || loc.includes('kumasi')) countryId = countryMap.get('ghana');
        else if (loc.includes('kampala') || loc.includes('entebbe')) countryId = countryMap.get('uganda');
        else if (loc.includes('dar es salaam') || loc.includes('dodoma') || loc.includes('arusha')) countryId = countryMap.get('tanzania');
        else if (loc.includes('kigali')) countryId = countryMap.get('rwanda');
        else if (loc.includes('johannesburg') || loc.includes('cape town')) countryId = countryMap.get('south africa');
      }

      // Fallback to config default country if applicable
      const fallbackCode = config.defaultCountryCode;
      if (!countryId && fallbackCode) {
        const defaultMap: Record<string, string> = {
          "KE": "kenya", "NG": "nigeria", "GH": "ghana", "UG": "uganda", "TZ": "tanzania", "RW": "rwanda", "ZA": "south africa"
        };
        const defaultCountryName = defaultMap[fallbackCode];
        if (defaultCountryName && (loc.includes('remote') || desc.includes(defaultCountryName))) {
          countryId = countryMap.get(defaultCountryName) || null;
        }
      }

      if (!countryId) continue;

      let jobType = 'full_time';
      const empType = (req.employmentType || '').toLowerCase();
      if (empType.includes('part')) jobType = 'part_time';
      if (empType.includes('contract') || empType.includes('temp')) jobType = 'contract';
      if (empType.includes('intern')) jobType = 'internship';

      const jobSector = normalizeSector(config.sector, req.title);
      const jobSkills = extractAuthenticSkills(req.title, req.descriptionPlain);

      parsedJobs.push({
        title: req.title,
        companyName: companyName,
        description: req.descriptionPlain || req.description || "View full description on company portal.",
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
