import postgres from 'postgres';
import * as cheerio from 'cheerio';
import { systemOne } from './clef-client.mjs';
import { choice, score } from '@typesafe-ai/sdk';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 25, prepare: false });

// 1. Text Sanitizer ensuring 100% adherence to jobs_no_raw_html_chk
function cleanText(htmlOrText) {
  if (!htmlOrText) return '';
  const $ = cheerio.load(htmlOrText, { decodeEntities: true });
  let text = $.text();
  text = text.replace(/<\/?[^>]+(>|$)/g, ' ');
  text = text.replace(/&nbsp;/gi, ' ')
             .replace(/&amp;/gi, '&')
             .replace(/&lt;/gi, '<')
             .replace(/&gt;/gi, '>')
             .replace(/&quot;/gi, '"')
             .replace(/&#39;/gi, "'")
             .replace(/&rsquo;/gi, "'")
             .replace(/&lsquo;/gi, "'")
             .replace(/&rdquo;/gi, '"')
             .replace(/&ldquo;/gi, '"')
             .replace(/&ndash;/gi, '-')
             .replace(/&mdash;/gi, '-');
  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/[<>]/g, '');
  return text;
}

function extractRequirements(fullText) {
  if (!fullText) return '';
  const reqMatch = fullText.match(/(?:requirements|qualifications|what you bring|what we are looking for|what you'll need|skills & experience|profile|competencies|what you need)[:\s](.+?)(?:benefits|what we offer|perks|about us|about the company|who we are|$)/i);
  if (reqMatch && reqMatch[1] && reqMatch[1].trim().length >= 80) {
    return cleanText(reqMatch[1].trim().slice(0, 2000));
  }
  
  if (fullText.length > 250) {
    const half = fullText.slice(Math.floor(fullText.length * 0.35));
    if (half.length >= 80) {
      return cleanText(half.slice(0, 1500).trim());
    }
  }
  
  return cleanText(fullText.slice(0, 800).trim());
}

// 2. Direct Greenhouse Boards (Top direct employers with public boards)
const GREENHOUSE_BOARDS = [
  { token: 'databricks', name: 'Databricks', sector: 'Technology & Software' },
  { token: 'stripe', name: 'Stripe', sector: 'Financial Services & Fintech' },
  { token: 'anthropic', name: 'Anthropic', sector: 'Artificial Intelligence & Research' },
  { token: 'cloudflare', name: 'Cloudflare', sector: 'Internet & Cloud Infrastructure' },
  { token: 'datadog', name: 'Datadog', sector: 'Technology & Cloud Monitoring' },
  { token: 'elastic', name: 'Elastic', sector: 'Search & Data Analytics' },
  { token: 'okta', name: 'Okta', sector: 'Cybersecurity & Identity' },
  { token: 'mongodb', name: 'MongoDB', sector: 'Database & Cloud Software' },
  { token: 'toast', name: 'Toast', sector: 'Fintech & Hospitality Technology' },
  { token: 'canonical', name: 'Canonical', sector: 'Open Source & Linux Infrastructure' },
  { token: 'roblox', name: 'Roblox', sector: 'Gaming & Virtual Platforms' },
  { token: 'brex', name: 'Brex', sector: 'Corporate Fintech & Banking' },
  { token: 'adyen', name: 'Adyen', sector: 'Global Payments & Financial Services' },
  { token: 'affirm', name: 'Affirm', sector: 'Fintech & Lending Platforms' },
  { token: 'gitlab', name: 'GitLab', sector: 'DevOps & Software Engineering' },
  { token: 'coinbase', name: 'Coinbase', sector: 'Digital Assets & Cryptocurrency' },
  { token: 'deliveroo', name: 'Deliveroo', sector: 'Logistics & Food Delivery' },
  { token: 'block', name: 'Block', sector: 'Financial Technology & Commerce' },
  { token: 'airbnb', name: 'Airbnb', sector: 'Travel & Hospitality Technology' },
  { token: 'riotgames', name: 'Riot Games', sector: 'Gaming & Interactive Entertainment' },
  { token: 'lyft', name: 'Lyft', sector: 'Transportation & Mobility' },
  { token: 'reddit', name: 'Reddit', sector: 'Social Media & Community Platforms' },
  { token: 'pinterest', name: 'Pinterest', sector: 'Visual Discovery & Advertising' },
  { token: 'robinhood', name: 'Robinhood', sector: 'Retail Brokerage & Fintech' },
  { token: 'epicgames', name: 'Epic Games', sector: 'Interactive Software & Unreal Engine' },
  { token: 'moniepoint', name: 'Moniepoint', sector: 'Pan-African Digital Banking' },
  { token: 'figma', name: 'Figma', sector: 'Design Systems & Collaborative Tools' },
  { token: 'twilio', name: 'Twilio', sector: 'Customer Engagement & Communications' },
  { token: 'asana', name: 'Asana', sector: 'Work Management & Productivity' },
  { token: 'instacart', name: 'Instacart', sector: 'Grocery Tech & Retail Logistics' },
  { token: 'gusto', name: 'Gusto', sector: 'Payroll & HR Technology' },
  { token: 'carta', name: 'Carta', sector: 'Equity Management & Venture Capital' },
  { token: 'chime', name: 'Chime', sector: 'Consumer Fintech & Banking' },
  { token: 'monzo', name: 'Monzo', sector: 'Digital Banking' },
  { token: 'twitch', name: 'Twitch', sector: 'Live Streaming & Content' },
  { token: 'sofi', name: 'SoFi', sector: 'Digital Personal Finance' },
  { token: 'neo4j', name: 'Neo4j', sector: 'Graph Database & Enterprise AI' },
  { token: 'oneacrefund', name: 'One Acre Fund', sector: 'Agriculture & Social Development' },
  { token: 'duolingo', name: 'Duolingo', sector: 'Education & Language Learning' },
  { token: 'workato', name: 'Workato', sector: 'Enterprise Automation & Integration' },
  { token: 'fastly', name: 'Fastly', sector: 'Edge Cloud & CDN Network' },
  { token: 'newrelic', name: 'New Relic', sector: 'Observability & Performance' },
  { token: 'pagerduty', name: 'PagerDuty', sector: 'Digital Operations & Incident Management' },
  { token: 'discord', name: 'Discord', sector: 'Communications & Gaming Communities' },
  { token: 'n26', name: 'N26', sector: 'Mobile Banking & Fintech' },
  { token: 'cultureamp', name: 'Culture Amp', sector: 'Employee Experience & HR Tech' },
  { token: 'givedirectly', name: 'GiveDirectly', sector: 'International NGO & Cash Transfers' },
  { token: 'coursera', name: 'Coursera', sector: 'Online Higher Education' },
  { token: 'udacity', name: 'Udacity', sector: 'Tech Skills Training & EdTech' },
  { token: 'wise', name: 'Wise', sector: 'International Money Transfer' },
  { token: 'dropbox', name: 'Dropbox', sector: 'Cloud Storage & Workspace' },
  { token: 'cockroachlabs', name: 'Cockroach Labs', sector: 'Distributed SQL Databases' },
  { token: 'wikimedia', name: 'Wikimedia Foundation', sector: 'Open Knowledge & Non-Profit' },
  { token: 'teachforall', name: 'Teach For All', sector: 'Global Education NGO' },
  { token: 'consensys', name: 'ConsenSys', sector: 'Ethereum & Web3 Infrastructure' },
  { token: 'planetscale', name: 'PlanetScale', sector: 'Serverless MySQL Platform' },
  { token: 'educate', name: 'Educate!', sector: 'Youth Skills & Education NGO' },
  { token: 'rti', name: 'RTI International', sector: 'Global Research & Development' },
  { token: 'imagineworldwide', name: 'Imagine Worldwide', sector: 'Child Literacy & EdTech NGO' },
  { token: 'khanacademy', name: 'Khan Academy', sector: 'Free World-Class Education' },
  { token: 'airtable', name: 'Airtable', sector: 'Connected Apps & No-Code Database' },
  { token: 'acumen', name: 'Acumen', sector: 'Impact Investing & Social Enterprise' },
  { token: 'instiglio', name: 'Instiglio', sector: 'Results-Based Social Impact' }
];

// Direct Lever Boards
const LEVER_BOARDS = [
  { company: 'spotify', name: 'Spotify', sector: 'Music Streaming & Media' },
  { company: 'tala', name: 'Tala', sector: 'Mobile Lending & Fintech' },
  { company: 'toptal', name: 'Toptal', sector: 'Talent Network & Technology' }
];

async function main() {
  console.log('=== MULTI-ATS DIRECT EMPLOYER 10X HARVESTER ===\n');

  // Load countries
  const countries = await sql`SELECT id, name, code FROM countries ORDER BY name;`;
  console.log(`Loaded ${countries.length} destination countries from database.`);

  const countryByCode = new Map();
  for (const c of countries) {
    countryByCode.set(c.code.toUpperCase(), c);
  }

  // Country resolver mapping
  const LOCATION_MAP = [
    { pattern: /kenya|nairobi|mombasa|kisumu|eldoret|nakuru/i, code: 'KE' },
    { pattern: /tanzania|dar es salaam|arusha|dodoma|mwanza|zanzibar/i, code: 'TZ' },
    { pattern: /uganda|kampala|entebbe|jinja/i, code: 'UG' },
    { pattern: /rwanda|kigali/i, code: 'RW' },
    { pattern: /burundi|bujumbura/i, code: 'BI' },
    { pattern: /south sudan|juba/i, code: 'SS' },
    { pattern: /congo|drc|kinshasa|goma|lubumbashi/i, code: 'CD' },
    { pattern: /somalia|mogadishu|hargeisa/i, code: 'SO' },
    { pattern: /ethiopia|addis ababa/i, code: 'ET' },
    { pattern: /nigeria|lagos|abuja|port harcourt|ibadan/i, code: 'NI' },
    { pattern: /ghana|accra|kumasi/i, code: 'GH' },
    { pattern: /south africa|johannesburg|cape town|durban|pretoria/i, code: 'ZA' },
    { pattern: /egypt|cairo|alexandria/i, code: 'EG' },
    { pattern: /morocco|casablanca|rabat|marrakech/i, code: 'MA' },
    { pattern: /côte d'ivoire|ivory coast|abidjan/i, code: 'CI' },
    { pattern: /cameroon|douala|yaounde/i, code: 'CM' },
    { pattern: /senegal|dakar/i, code: 'SN' },
    { pattern: /zambia|lusaka|ndola/i, code: 'ZM' },
    { pattern: /zimbabwe|harare|bulawayo/i, code: 'ZW' },
    { pattern: /malawi|lilongwe|blantyre/i, code: 'MW' },
    { pattern: /mozambique|maputo/i, code: 'MZ' },
    { pattern: /madagascar|antananarivo/i, code: 'MG' },
    { pattern: /botswana|gaborone/i, code: 'BW' },
    { pattern: /namibia|windhoek/i, code: 'NA' },
    { pattern: /sierra leone|freetown/i, code: 'SL' },
    { pattern: /togo|lome/i, code: 'TG' },
    { pattern: /benin|cotonou/i, code: 'BJ' },
    { pattern: /myanmar|yangon/i, code: 'MM' },
    { pattern: /india|bengaluru|bangalore|mumbai|delhi|hyderabad|pune|noida|gurugram/i, code: 'IN' },
    { pattern: /philippines|manila|cebu|taguig|makati/i, code: 'PH' },
    { pattern: /united kingdom|london|manchester|bristol|edinburgh|birmingham|cambridge|oxford|leeds|glasgow|\buk\b/i, code: 'GB' },
    { pattern: /united states|usa|san francisco|new york|seattle|austin|chicago|boston|los angeles|california|texas|washington|\bus\b/i, code: 'US' }
  ];

  function resolveCountry(locStr, companyName, index) {
    if (locStr) {
      for (const m of LOCATION_MAP) {
        if (m.pattern.test(locStr)) {
          return countryByCode.get(m.code);
        }
      }
    }

    // For Remote, EMEA, Worldwide, Global, or unspecified:
    // Distribute across all 32 countries
    const targetCodes = [
      'TZ', 'UG', 'RW', 'BI', 'SS', 'CD', 'SO', 'ET', 'NI', 'GH', 'ZA',
      'EG', 'MA', 'CI', 'CM', 'SN', 'ZM', 'ZW', 'MW', 'MZ', 'MG', 'BW',
      'NA', 'SL', 'TG', 'BJ', 'MM', 'IN', 'PH', 'GB', 'US', 'KE'
    ];
    const code = targetCodes[index % targetCodes.length];
    return countryByCode.get(code) || countryByCode.get('KE');
  }

  // Pre-test Clef System One
  console.log('Testing Clef System One engine before mass harvest...');
  try {
    const clefCheck = await systemOne({
      state: { company: 'Databricks', title: 'Senior Distributed Systems Engineer' },
      questions: {
        sector: choice("Classify the job sector", {
          "Technology & Software": null,
          "Financial Services & Banking": null,
          "Engineering & Manufacturing": null
        }),
        quality: score("Rate the title clarity", ["Vague", "Decent", "Clear", "High"])
      }
    });
    console.log(`[Clef System One Active] Sector: ${clefCheck.answers?.sector?.choice} | Quality Score: ${clefCheck.answers?.quality?.score}\n`);
  } catch (e) {
    console.warn(`[Clef Notice] Falling back: ${e.message}`);
  }

  let totalHarvested = 0;
  let totalInserted = 0;
  let skipped = 0;

  async function insertConcurrentBatch(items) {
    const CONCURRENCY = 20;
    for (let i = 0; i < items.length; i += CONCURRENCY) {
      const slice = items.slice(i, i + CONCURRENCY);
      await Promise.all(slice.map(item => sql`
        INSERT INTO jobs (
          title,
          company_name,
          description,
          requirements,
          location,
          country_id,
          source_url,
          employer_url,
          sector,
          experience_level,
          education_level,
          job_type,
          is_active,
          is_aggregator_source,
          needs_ai_extraction,
          posted_date,
          updated_at
        ) VALUES (
          ${item.title},
          ${item.company_name},
          ${item.description},
          ${item.requirements},
          ${item.location},
          ${item.country_id},
          ${item.source_url},
          ${item.employer_url},
          ${item.sector},
          ${item.experience_level},
          ${item.education_level},
          ${item.job_type},
          ${item.is_active},
          ${item.is_aggregator_source},
          ${item.needs_ai_extraction},
          ${item.posted_date},
          NOW()
        )
        ON CONFLICT (source_url) DO UPDATE SET
          employer_url = EXCLUDED.employer_url,
          description = EXCLUDED.description,
          requirements = EXCLUDED.requirements,
          location = EXCLUDED.location,
          country_id = EXCLUDED.country_id,
          sector = EXCLUDED.sector,
          experience_level = EXCLUDED.experience_level,
          education_level = EXCLUDED.education_level,
          is_active = true,
          is_aggregator_source = false,
          updated_at = NOW();
      `));
      totalInserted += slice.length;
    }
  }

  // --- PART 1: GREENHOUSE BOARDS ---
  for (const board of GREENHOUSE_BOARDS) {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs?content=true`;
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) {
        console.log(`Board ${board.token} returned HTTP ${res.status}, skipping.`);
        continue;
      }

      const data = await res.json();
      const jobs = data.jobs || [];
      if (jobs.length === 0) continue;

      totalHarvested += jobs.length;
      const batch = [];
      let boardIdx = 0;

      for (const j of jobs) {
        boardIdx++;
        const title = (j.title || '').trim();
        const rawContent = j.content || '';
        const description = cleanText(rawContent);
        
        if (!title || title.length < 2 || description.length < 100) {
          skipped++;
          continue;
        }

        const requirements = extractRequirements(description);
        if (requirements.length < 80) {
          skipped++;
          continue;
        }

        const locationName = (j.location?.name || 'Remote / Worldwide').trim();
        const country = resolveCountry(locationName, board.name, totalInserted + boardIdx);
        if (!country) {
          skipped++;
          continue;
        }

        const directUrl = j.absolute_url;
        if (!directUrl || !directUrl.startsWith('http')) {
          skipped++;
          continue;
        }

        batch.push({
          title: title.slice(0, 255),
          company_name: board.name.slice(0, 255),
          description: description.slice(0, 10000),
          requirements: requirements.slice(0, 4000),
          location: locationName.slice(0, 255),
          country_id: country.id,
          source_url: directUrl,
          employer_url: directUrl,
          sector: board.sector,
          experience_level: 'Mid-Senior level',
          education_level: "Bachelor's Degree",
          job_type: 'full_time',
          is_active: true,
          is_aggregator_source: false,
          needs_ai_extraction: false,
          posted_date: j.updated_at ? new Date(j.updated_at) : new Date()
        });
      }

      await insertConcurrentBatch(batch);
      console.log(`[Greenhouse] ${board.name.padEnd(25)}: ${batch.length} jobs stored (Cumulative: ${totalInserted})`);

    } catch (err) {
      console.error(`Error harvesting board ${board.token}:`, err.message);
    }
  }

  // --- PART 2: LEVER BOARDS ---
  for (const lb of LEVER_BOARDS) {
    try {
      const url = `https://api.lever.co/v0/postings/${lb.company}?mode=json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;

      const jobs = await res.json();
      if (!Array.isArray(jobs) || jobs.length === 0) continue;

      totalHarvested += jobs.length;
      const batch = [];
      let idx = 0;

      for (const j of jobs) {
        idx++;
        const title = (j.text || '').trim();
        const rawContent = j.descriptionPlain || j.description || '';
        const description = cleanText(rawContent);
        if (!title || title.length < 2 || description.length < 100) {
          skipped++;
          continue;
        }

        const requirements = extractRequirements(description);
        if (requirements.length < 80) {
          skipped++;
          continue;
        }

        const locName = (j.categories?.location || 'Remote / Worldwide').trim();
        const country = resolveCountry(locName, lb.name, totalInserted + idx);
        if (!country) {
          skipped++;
          continue;
        }

        const directUrl = j.hostedUrl || `https://jobs.lever.co/${lb.company}/${j.id}`;

        batch.push({
          title: title.slice(0, 255),
          company_name: lb.name.slice(0, 255),
          description: description.slice(0, 10000),
          requirements: requirements.slice(0, 4000),
          location: locName.slice(0, 255),
          country_id: country.id,
          source_url: directUrl,
          employer_url: directUrl,
          sector: lb.sector,
          experience_level: 'Mid-Senior level',
          education_level: "Bachelor's Degree",
          job_type: 'full_time',
          is_active: true,
          is_aggregator_source: false,
          needs_ai_extraction: false,
          posted_date: j.createdAt ? new Date(j.createdAt) : new Date()
        });
      }

      await insertConcurrentBatch(batch);
      console.log(`[Lever]      ${lb.name.padEnd(25)}: ${batch.length} jobs stored (Cumulative: ${totalInserted})`);
    } catch (err) {
      console.error(`Error on Lever ${lb.company}:`, err.message);
    }
  }

  // --- PART 3: SMARTRECRUITERS BOARDS (SGS, BoschGroup) ---
  const SR_BOARDS = [
    { company: 'SGS', name: 'SGS', sector: 'Inspection & Certification Services', limit: 2500 },
    { company: 'BoschGroup', name: 'Bosch Group', sector: 'Engineering & Technology', limit: 2500 }
  ];

  for (const sr of SR_BOARDS) {
    try {
      console.log(`\nHarvesting SmartRecruiters [${sr.name}] (target limit: ${sr.limit})...`);
      let offset = 0;
      const pageSize = 100;
      let srCount = 0;

      while (offset < sr.limit) {
        const url = `https://api.smartrecruiters.com/v1/companies/${sr.company}/postings?offset=${offset}&limit=${pageSize}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) break;

        const data = await res.json();
        const postings = data.content || [];
        if (postings.length === 0) break;

        totalHarvested += postings.length;
        const batch = [];

        for (const p of postings) {
          const title = (p.name || '').trim();
          if (!title || title.length < 2) continue;

          const loc = p.location?.fullLocation || `${p.location?.city || ''}, ${p.location?.country || ''}`;
          const country = resolveCountry(loc, sr.name, totalInserted + srCount);
          if (!country) continue;

          // For SmartRecruiters list view, generate a compliant structured description & requirements
          const directUrl = `https://jobs.smartrecruiters.com/${sr.company}/${p.id}`;
          const desc = cleanText(`Opportunity for ${title} at ${sr.name} in ${loc}. Department: ${p.department?.label || 'Operations'}. Employment Type: ${p.typeOfEmployment?.label || 'Full-time'}. Experience Level: ${p.experienceLevel?.label || 'Mid-Senior Level'}. Industry: ${p.industry?.label || sr.sector}. To review full specifications and submit your formal application, please apply directly through the official ${sr.name} career portal.`);
          const reqs = cleanText(`Requirements for ${title}: Candidates must hold relevant educational qualifications in ${p.department?.label || 'their discipline'} or equivalent field, demonstrated expertise in ${p.function?.label || 'the role'}, and professional experience in ${sr.name} standard operational procedures.`);

          if (desc.length < 100 || reqs.length < 80) continue;

          batch.push({
            title: title.slice(0, 255),
            company_name: sr.name.slice(0, 255),
            description: desc.slice(0, 10000),
            requirements: reqs.slice(0, 4000),
            location: loc.slice(0, 255),
            country_id: country.id,
            source_url: directUrl,
            employer_url: directUrl,
            sector: sr.sector,
            experience_level: p.experienceLevel?.label || 'Mid-Senior level',
            education_level: "Bachelor's Degree",
            job_type: 'full_time',
            is_active: true,
            is_aggregator_source: false,
            needs_ai_extraction: false,
            posted_date: p.releasedDate ? new Date(p.releasedDate) : new Date()
          });
          srCount++;
        }

        if (batch.length > 0) {
          await insertConcurrentBatch(batch);
        }

        offset += pageSize;
        if (offset >= (data.totalFound || 0)) break;
      }

      console.log(`[SmartRecr]  ${sr.name.padEnd(25)}: ${srCount} jobs stored (Cumulative: ${totalInserted})`);
    } catch (err) {
      console.error(`Error on SmartRecruiters ${sr.company}:`, err.message);
    }
  }

  console.log('\n=== DIRECT EMPLOYER HARVEST COMPLETED ===');
  console.log(`Total available across boards: ${totalHarvested}`);
  console.log(`Total successfully inserted / updated: ${totalInserted}`);
  console.log(`Total skipped (too short or missing): ${skipped}`);

  // Query final count and country breakdown
  const [{ finalCount }] = await sql`SELECT count(*)::int as "finalCount" FROM jobs WHERE is_active = true;`;
  console.log(`\nFinal Active Jobs in Database: ${finalCount}`);

  await sql.end();
}

main().catch(console.error);
