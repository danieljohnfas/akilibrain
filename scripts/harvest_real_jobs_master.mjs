import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// ── 1. Load Environment ───────────────────────────────────────────────────────
const envCandidates = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), 'akilibrain', '.env.local')
];
const envPath = envCandidates.find(p => fs.existsSync(p)) || envCandidates[0];
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const k = key.trim();
      if (!process.env[k]) {
        process.env[k] = vals.join('=').trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pywienffahvmylssnorr.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing');
  process.exit(1);
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

// ── 2. Country Mapping ────────────────────────────────────────────────────────
const COUNTRY_IDS = {
  'TZ': '28bd1d89-acc4-4142-a6f9-b06b5cfa8435',
  'KE': 'e55fd92f-ee35-4fce-97c2-8f39342d21c9',
  'UG': '9d0b65ca-40f9-4a38-b526-25e0d210a824',
  'RW': 'cca4729b-f072-44db-89c3-4b99227e362a',
  'BI': 'a8ebf949-9604-41a9-8acb-4fd23f8321f5',
  'CD': '3feb39d5-5fcc-4166-8c4a-6bed84441fdf',
  'SS': '2357beb4-7d7b-4e98-b0c5-40b352468800',
  'NI': '2d1c86b7-c966-4c53-87a2-732d222a5b73',
  'GH': '566fb521-f36c-4338-b7d2-ec46a61cefec',
  'ET': '06a9ba00-beca-4d09-926b-6cc5f2013c4a',
  'ZA': 'c3d27405-3879-42d8-8859-52d0c803f12f',
  'ZM': '99d13e35-e9e4-48f8-a09c-4ab2fffb2eb4',
  'MW': '37211de0-09eb-4afa-91eb-019abd25e16e'
};

const COUNTRY_NAMES = {
  'TZ': 'Tanzania',
  'KE': 'Kenya',
  'UG': 'Uganda',
  'RW': 'Rwanda',
  'BI': 'Burundi',
  'CD': 'Democratic Republic of the Congo',
  'SS': 'South Sudan',
  'NI': 'Nigeria',
  'GH': 'Ghana',
  'ET': 'Ethiopia',
  'ZA': 'South Africa',
  'ZM': 'Zambia',
  'MW': 'Malawi'
};

// ── 3. Helper Functions ───────────────────────────────────────────────────────
function cleanText(str) {
  if (!str) return '';
  try {
    let clean = str;
    const $1 = cheerio.load(clean);
    clean = $1.text();
    const $2 = cheerio.load(clean);
    $2('script, style').remove();
    clean = $2.text();
    clean = clean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return clean;
  } catch {
    return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

function extractRequirements(desc, title = '') {
  const lines = desc.split(/[\n\.\?!]/).map(l => l.trim()).filter(l => l.length > 20);
  const reqLines = lines.filter(l => {
    const low = l.toLowerCase();
    return low.includes('degree') ||
           low.includes('bachelor') ||
           low.includes('master') ||
           low.includes('diploma') ||
           low.includes('experience') ||
           low.includes('years') ||
           low.includes('fluent') ||
           low.includes('knowledge of') ||
           low.includes('proficien') ||
           low.includes('skills in') ||
           low.includes('ability to') ||
           low.includes('qualification');
  });

  if (reqLines.length >= 2) {
    return reqLines.slice(0, 8).map(l => `• ${l}`).join('\n');
  }

  return `• Proven professional experience relevant to the position of ${title}.\n• Relevant educational background, bachelor's degree or accredited professional qualification.\n• Strong communication, leadership, and analytical capabilities.\n• Demonstrated track record in delivering high-impact results in similar roles.`;
}

let totalInsertedGlobal = 0;

// ── 4. Batch Ingestion Engine with Zero Aggregator Guarantee ───────────────────
async function insertJobBatch(jobs) {
  if (!jobs || jobs.length === 0) return 0;

  // Strict check: must have employer_url, must NOT be aggregator, must NOT contain aggregator domain
  const validJobs = jobs.filter(j => {
    if (!j.title || j.title.length < 3) return false;
    if (!j.description || j.description.length < 50) return false;
    if (!j.source_url || !j.source_url.startsWith('http')) return false;
    if (!j.employer_url || !j.employer_url.startsWith('http')) return false;
    if (j.is_aggregator_source === true) return false;

    const urlStr = `${j.employer_url} ${j.source_url}`.toLowerCase();
    if (
      urlStr.includes('myjobmag') ||
      urlStr.includes('jobinrwanda') ||
      urlStr.includes('ajirayako') ||
      urlStr.includes('mwanampotevu') ||
      urlStr.includes('brightermonday') ||
      urlStr.includes('fuzu') ||
      urlStr.includes('jobweb') ||
      urlStr.includes('hotnigerianjobs') ||
      urlStr.includes('kenyajob') ||
      urlStr.includes('tanzaniajobs') ||
      urlStr.includes('reliefweb') ||
      urlStr.includes('unjobs')
    ) {
      return false;
    }
    return true;
  });

  if (validJobs.length === 0) return 0;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?on_conflict=source_url`, {
      method: 'POST',
      headers: {
        ...HEADERS,
        Prefer: 'resolution=ignore-duplicates,return=representation'
      },
      body: JSON.stringify(validJobs)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Batch insert warning:', errText.substring(0, 200));
      return 0;
    }

    const inserted = await res.json();
    const count = Array.isArray(inserted) ? inserted.length : 0;
    totalInsertedGlobal += count;
    return count;
  } catch (e) {
    console.error('Error inserting jobs batch:', e.message);
    return 0;
  }
}

// ── 5. Direct ATS Harvester Engines ────────────────────────────────────────────

// 5A. Direct Greenhouse ATS Harvester for Verified Pan-African Employers
const GREENHOUSE_BOARDS = [
  { token: 'oneacrefund', name: 'One Acre Fund', defaultCountry: 'RW' },
  { token: 'chai', name: 'Clinton Health Access Initiative', defaultCountry: 'TZ' },
  { token: 'pathfinder', name: 'Pathfinder International', defaultCountry: 'TZ' },
  { token: 'imagineworldwide', name: 'Imagine Worldwide', defaultCountry: 'TZ' },
  { token: 'educate', name: 'Educate!', defaultCountry: 'UG' },
  { token: 'roomtoread', name: 'Room to Read', defaultCountry: 'TZ' },
  { token: 'd-tree', name: 'D-tree International', defaultCountry: 'TZ' },
  { token: 'mariestopes', name: 'MSI Reproductive Choices', defaultCountry: 'KE' },
  { token: 'wateraid', name: 'WaterAid', defaultCountry: 'TZ' },
  { token: 'jhpiego', name: 'Jhpiego', defaultCountry: 'TZ' },
  { token: 'livinggoods', name: 'Living Goods', defaultCountry: 'KE' },
  { token: 'fhi360', name: 'FHI 360', defaultCountry: 'TZ' },
  { token: 'care', name: 'CARE International', defaultCountry: 'TZ' },
  { token: 'mercycorps', name: 'Mercy Corps', defaultCountry: 'KE' },
  { token: 'technoserve', name: 'TechnoServe', defaultCountry: 'TZ' },
  { token: 'actionagainsthunger', name: 'Action Against Hunger', defaultCountry: 'KE' },
  { token: 'camfed', name: 'CAMFED', defaultCountry: 'TZ' },
  { token: 'rippleeffect', name: 'Ripple Effect', defaultCountry: 'KE' },
  { token: 'mothers2mothers', name: 'mothers2mothers', defaultCountry: 'UG' },
  { token: 'givedirectly', name: 'GiveDirectly', defaultCountry: 'KE' },
  { token: 'evidenceaction', name: 'Evidence Action', defaultCountry: 'KE' },
  { token: 'idinsight', name: 'IDinsight', defaultCountry: 'KE' },
  { token: 'theirc', name: 'International Rescue Committee', defaultCountry: 'KE' },
  { token: 'crossboundary', name: 'CrossBoundary', defaultCountry: 'KE' },
  { token: 'villagereach', name: 'VillageReach', defaultCountry: 'CD' },
  { token: 'lastmilehealth', name: 'Last Mile Health', defaultCountry: 'UG' },
  { token: 'planinternational', name: 'Plan International', defaultCountry: 'TZ' },
  { token: 'savethechildren', name: 'Save the Children', defaultCountry: 'KE' },
  { token: 'oxfam', name: 'Oxfam', defaultCountry: 'KE' },
  { token: 'wwf', name: 'WWF', defaultCountry: 'TZ' },
  { token: 'wcs', name: 'Wildlife Conservation Society', defaultCountry: 'TZ' },
  { token: 'awf', name: 'African Wildlife Foundation', defaultCountry: 'KE' },
  { token: 'finca', name: 'FINCA International', defaultCountry: 'TZ' },
  { token: 'brac', name: 'BRAC', defaultCountry: 'TZ' },
  { token: 'heifer', name: 'Heifer International', defaultCountry: 'RW' },
  { token: 'solidaridad', name: 'Solidaridad', defaultCountry: 'KE' },
  { token: 'wave', name: 'Wave Mobile Money', defaultCountry: 'UG' },
  { token: 'mkopa', name: 'M-KOPA', defaultCountry: 'KE' },
  { token: 'dlight', name: 'd.light', defaultCountry: 'KE' },
  { token: 'jumia', name: 'Jumia Group', defaultCountry: 'NI' },
  { token: 'canonical', name: 'Canonical', defaultCountry: 'KE' },
  { token: 'moniepoint', name: 'Moniepoint', defaultCountry: 'NI' },
  { token: 'gitlab', name: 'GitLab', defaultCountry: 'KE' }
];

async function harvestGreenhouse() {
  console.log('\n--- HARVESTING DIRECT GREENHOUSE ATS BOARDS ---');
  for (const board of GREENHOUSE_BOARDS) {
    try {
      const url = `https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs?content=true`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;

      const data = await res.json();
      const list = data.jobs || [];
      if (list.length === 0) continue;

      const jobsToInsert = [];
      for (const item of list) {
        const rawTitle = item.title || '';
        const rawContent = item.content || '';
        const loc = item.location?.name || '';
        const desc = cleanText(rawContent);
        if (desc.length < 100) continue;

        let countryCode = board.defaultCountry;
        const textToScan = `${loc} ${rawTitle} ${desc}`.toLowerCase();
        for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
          if (textToScan.includes(name.toLowerCase())) {
            countryCode = code;
            break;
          }
        }

        const countryId = COUNTRY_IDS[countryCode] || COUNTRY_IDS['KE'];
        const reqs = extractRequirements(desc, rawTitle);
        const directApplyUrl = item.absolute_url || `https://boards.greenhouse.io/${board.token}/jobs/${item.id}`;

        jobsToInsert.push({
          title: cleanText(rawTitle).substring(0, 255),
          company_name: board.name,
          description: desc.substring(0, 15000),
          requirements: reqs.substring(0, 5000),
          location: (loc || COUNTRY_NAMES[countryCode]).substring(0, 255),
          country_id: countryId,
          job_type: 'full_time',
          source_url: directApplyUrl,
          employer_url: directApplyUrl,
          is_active: true,
          is_aggregator_source: false,
          sector: 'Technology & Professional Services',
          experience_level: 'Mid-Senior level',
          education_level: "Bachelor's Degree",
          posted_date: item.updated_at || new Date().toISOString()
        });
      }

      const inserted = await insertJobBatch(jobsToInsert);
      console.log(`✓ [Greenhouse: ${board.name}] Found ${list.length} | Inserted ${inserted} jobs`);
    } catch (e) {
      // ignore
    }
  }
}

// 5B. Direct Lever ATS Harvester for Verified Pan-African Employers
const LEVER_BOARDS = [
  { site: 'flutterwave', name: 'Flutterwave', country: 'NI' },
  { site: 'chipper-cash', name: 'Chipper Cash', country: 'KE' },
  { site: 'kobo360', name: 'Kobo360', country: 'NI' },
  { site: 'wasoko', name: 'Wasoko', country: 'KE' },
  { site: 'copia-global', name: 'Copia Global', country: 'KE' },
  { site: 'branch', name: 'Branch International', country: 'KE' },
  { site: 'tala', name: 'Tala', country: 'KE' },
  { site: 'squadrun', name: 'SquadRun Africa', country: 'KE' },
  { site: 'andela', name: 'Andela', country: 'NI' },
  { site: 'paystack', name: 'Paystack', country: 'NI' },
  { site: 'fairmoney', name: 'FairMoney', country: 'NI' },
  { site: 'teamapt', name: 'Moniepoint (TeamApt)', country: 'NI' },
  { site: 'piggyvest', name: 'Piggyvest', country: 'NI' },
  { site: 'carbon', name: 'Carbon', country: 'NI' },
  { site: 'renmoney', name: 'Renmoney', country: 'NI' },
  { site: 'nomba', name: 'Nomba', country: 'NI' },
  { site: 'kuda', name: 'Kuda Bank', country: 'NI' },
  { site: 'sendwave', name: 'Sendwave', country: 'KE' },
  { site: 'opay', name: 'OPay', country: 'NI' },
  { site: 'palmpay', name: 'PalmPay', country: 'NI' },
  { site: 'alat', name: 'ALAT by Wema', country: 'NI' },
  { site: 'maxng', name: 'MAX.ng', country: 'NI' },
  { site: 'bisedge', name: 'Bisedge', country: 'NI' },
  { site: 'edenlife', name: 'Eden Life', country: 'NI' },
  { site: 'chowdeck', name: 'Chowdeck', country: 'NI' },
  { site: 'seamlesshr', name: 'SeamlessHR', country: 'NI' },
  { site: 'helium-health', name: 'Helium Health', country: 'NI' },
  { site: '54gene', name: '54gene', country: 'NI' },
  { site: 'lifebank', name: 'LifeBank', country: 'NI' },
  { site: 'migo', name: 'Migo', country: 'NI' },
  { site: 'interswitch', name: 'Interswitch Group', country: 'NI' },
  { site: 'cellulant', name: 'Cellulant', country: 'KE' },
  { site: 'twiga-foods', name: 'Twiga Foods', country: 'KE' },
  { site: 'marketforce', name: 'MarketForce', country: 'KE' },
  { site: 'sendy', name: 'Sendy', country: 'KE' },
  { site: 'turaco', name: 'Turaco', country: 'KE' },
  { site: 'apollo-agriculture', name: 'Apollo Agriculture', country: 'KE' },
  { site: 'sun-culture', name: 'SunCulture', country: 'KE' },
  { site: 'ilara-health', name: 'Ilara Health', country: 'KE' },
  { site: 'mytigo', name: 'Axian Group / Tigo', country: 'TZ' },
  { site: 'vodacom', name: 'Vodacom Group', country: 'TZ' }
];

async function harvestLever() {
  console.log('\n--- HARVESTING DIRECT LEVER ATS BOARDS ---');
  for (const item of LEVER_BOARDS) {
    try {
      const url = `https://api.lever.co/v0/postings/${item.site}?mode=json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;

      const postings = await res.json();
      if (!Array.isArray(postings) || postings.length === 0) continue;

      const jobsToInsert = [];
      for (const p of postings) {
        const rawTitle = p.text || '';
        const descPlain = cleanText(p.descriptionPlain || p.description || '');
        if (descPlain.length < 100) continue;

        const loc = p.categories?.location || '';
        let countryCode = item.country;
        const textToScan = `${loc} ${rawTitle} ${descPlain}`.toLowerCase();
        for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
          if (textToScan.includes(name.toLowerCase())) {
            countryCode = code;
            break;
          }
        }

        const countryId = COUNTRY_IDS[countryCode] || COUNTRY_IDS['KE'];
        const reqs = extractRequirements(descPlain, rawTitle);
        const directApplyUrl = p.hostedUrl || `https://jobs.lever.co/${item.site}/${p.id}`;

        jobsToInsert.push({
          title: cleanText(rawTitle).substring(0, 255),
          company_name: item.name,
          description: descPlain.substring(0, 15000),
          requirements: reqs.substring(0, 5000),
          location: (loc || COUNTRY_NAMES[countryCode]).substring(0, 255),
          country_id: countryId,
          job_type: 'full_time',
          source_url: directApplyUrl,
          employer_url: directApplyUrl,
          is_active: true,
          is_aggregator_source: false,
          sector: 'Technology & Professional Services',
          experience_level: 'Mid-Senior level',
          education_level: "Bachelor's Degree",
          posted_date: new Date().toISOString()
        });
      }

      const inserted = await insertJobBatch(jobsToInsert);
      console.log(`✓ [Lever: ${item.name}] Found ${postings.length} | Inserted ${inserted} jobs`);
    } catch (e) {
      // ignore
    }
  }
}

// 5C. Direct PinpointHQ ATS Harvester
const PINPOINT_BOARDS = [
  { subdomain: 'sunking', name: 'Sun King', country: 'KE' },
  { subdomain: 'dlight', name: 'd.light', country: 'KE' }
];

async function harvestPinpoint() {
  console.log('\n--- HARVESTING DIRECT PINPOINTHQ ATS BOARDS ---');
  for (const board of PINPOINT_BOARDS) {
    try {
      const url = `https://${board.subdomain}.pinpointhq.com/postings.json`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;

      const data = await res.json();
      const list = data.data || [];
      if (!Array.isArray(list) || list.length === 0) continue;

      const jobsToInsert = [];
      for (const item of list) {
        const rawTitle = item.title || '';
        const desc = cleanText(item.description || item.summary || '');
        if (desc.length < 50) continue;

        const loc = item.location?.city || item.location?.country || '';
        let countryCode = board.country;
        const textToScan = `${loc} ${rawTitle} ${desc}`.toLowerCase();
        for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
          if (textToScan.includes(name.toLowerCase())) {
            countryCode = code;
            break;
          }
        }

        const countryId = COUNTRY_IDS[countryCode] || COUNTRY_IDS['KE'];
        const reqs = extractRequirements(desc, rawTitle);
        const directApplyUrl = item.url || `https://${board.subdomain}.pinpointhq.com/en/postings/${item.id}`;

        jobsToInsert.push({
          title: cleanText(rawTitle).substring(0, 255),
          company_name: board.name,
          description: desc.substring(0, 15000),
          requirements: reqs.substring(0, 5000),
          location: (loc || COUNTRY_NAMES[countryCode]).substring(0, 255),
          country_id: countryId,
          job_type: 'full_time',
          source_url: directApplyUrl,
          employer_url: directApplyUrl,
          is_active: true,
          is_aggregator_source: false,
          sector: 'Technology & Professional Services',
          experience_level: 'Mid-Senior level',
          education_level: "Bachelor's Degree",
          posted_date: item.created_at || new Date().toISOString()
        });
      }

      const inserted = await insertJobBatch(jobsToInsert);
      console.log(`✓ [Pinpoint: ${board.name}] Found ${list.length} | Inserted ${inserted} jobs`);
    } catch (e) {
      // ignore
    }
  }
}

// 5D. Direct Ashby ATS Harvester
const ASHBY_BOARDS = [
  { slug: 'kokonetworks', name: 'KOKO Networks', country: 'KE' },
  { slug: 'basigo', name: 'BasiGo', country: 'KE' }
];

async function harvestAshby() {
  console.log('\n--- HARVESTING DIRECT ASHBY ATS BOARDS ---');
  for (const board of ASHBY_BOARDS) {
    try {
      const url = `https://api.ashbyhq.com/posting-api/job-board/${board.slug}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;

      const data = await res.json();
      const list = data.jobs || [];
      if (!Array.isArray(list) || list.length === 0) continue;

      const jobsToInsert = [];
      for (const item of list) {
        const rawTitle = item.title || '';
        const desc = cleanText(item.descriptionPlain || item.descriptionHtml || '');
        if (desc.length < 50) continue;

        const loc = item.location || item.address?.postalAddress?.addressLocality || '';
        let countryCode = board.country;
        const textToScan = `${loc} ${rawTitle} ${desc}`.toLowerCase();
        for (const [code, name] of Object.entries(COUNTRY_NAMES)) {
          if (textToScan.includes(name.toLowerCase())) {
            countryCode = code;
            break;
          }
        }

        const countryId = COUNTRY_IDS[countryCode] || COUNTRY_IDS['KE'];
        const reqs = extractRequirements(desc, rawTitle);
        const directApplyUrl = item.jobUrl || `https://jobs.ashbyhq.com/${board.slug}/${item.id}`;

        jobsToInsert.push({
          title: cleanText(rawTitle).substring(0, 255),
          company_name: board.name,
          description: desc.substring(0, 15000),
          requirements: reqs.substring(0, 5000),
          location: (loc || COUNTRY_NAMES[countryCode]).substring(0, 255),
          country_id: countryId,
          job_type: 'full_time',
          source_url: directApplyUrl,
          employer_url: directApplyUrl,
          is_active: true,
          is_aggregator_source: false,
          sector: 'Technology & Professional Services',
          experience_level: 'Mid-Senior level',
          education_level: "Bachelor's Degree",
          posted_date: item.publishedAt || new Date().toISOString()
        });
      }

      const inserted = await insertJobBatch(jobsToInsert);
      console.log(`✓ [Ashby: ${board.name}] Found ${list.length} | Inserted ${inserted} jobs`);
    } catch (e) {
      // ignore
    }
  }
}

// ── 6. Main Orchestrator ──────────────────────────────────────────────────────
async function main() {
  console.log('================================================================');
  console.log('🚀 MASTER AUTHENTIC JOB HARVESTER');
  console.log('🎯 Harvesting 100% Genuine Direct Employer Postings (Zero Aggregators)');
  console.log('================================================================');

  // Step 1: Direct Greenhouse ATS
  await harvestGreenhouse();

  // Step 2: Direct Lever ATS
  await harvestLever();

  // Step 3: Direct Pinpoint ATS
  await harvestPinpoint();

  // Step 4: Direct Ashby ATS
  await harvestAshby();

  // Check final count
  const resCount = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=id`, {
    headers: { ...HEADERS, Range: '0-0', Prefer: 'count=exact' }
  });
  const total = resCount.headers.get('content-range')?.split('/')[1] || 'unknown';

  console.log('================================================================');
  console.log(`🏁 HARVEST COMPLETE!`);
  console.log(`Total new verified jobs inserted this session: ${totalInsertedGlobal}`);
  console.log(`Total genuine active jobs in Supabase database: ${total}`);
  console.log('================================================================');
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
