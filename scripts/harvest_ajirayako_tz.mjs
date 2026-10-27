import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), 'akilibrain', '.env.local');
let key = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      key = line.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pywienffahvmylssnorr.supabase.co';
const HEADERS = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json'
};

const TZ_COUNTRY_ID = '28bd1d89-acc4-4142-a6f9-b06b5cfa8435';

function cleanText(raw) {
  if (!raw) return '';
  const $ = cheerio.load(`<div>${raw}</div>`);
  let text = $('body').text();
  text = text.replace(/<[^>]*>/g, ' ')
             .replace(/<!--[\s\S]*?-->/g, ' ')
             .replace(/&nbsp;/gi, ' ')
             .replace(/&amp;/gi, '&')
             .replace(/&lt;/gi, ' ')
             .replace(/&gt;/gi, ' ')
             .replace(/&quot;/gi, '"')
             .replace(/&#39;/gi, "'")
             .replace(/[<>]/g, '')
             .replace(/\s+/g, ' ')
             .trim();
  return text;
}

async function insertJobBatch(jobs) {
  if (!jobs || jobs.length === 0) return 0;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?on_conflict=source_url`, {
      method: 'POST',
      headers: {
        ...HEADERS,
        Prefer: 'resolution=ignore-duplicates,return=representation'
      },
      body: JSON.stringify(jobs)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Insert error:', errText.substring(0, 200));
      return 0;
    }
    const inserted = await res.json();
    return Array.isArray(inserted) ? inserted.length : 0;
  } catch (e) {
    console.error('Insert error:', e.message);
    return 0;
  }
}

async function harvestAjiraYako(pages = 30) {
  console.log('================================================================');
  console.log('🇹🇿 AJIRAYAKO TANZANIA AUTHENTIC JOB HARVESTER');
  console.log('================================================================\n');

  let totalInserted = 0;

  for (let page = 1; page <= pages; page++) {
    try {
      const url = `https://ajirayako.co.tz/page/${page}/`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(12000)
      });
      if (!res.ok) {
        if (res.status === 404) break;
        continue;
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const jobsToInsert = [];

      $('h3.loop-item-title').each((_, el) => {
        const linkEl = $(el).find('a');
        const rawTitle = linkEl.text().trim();
        const href = linkEl.attr('href');
        const parent = $(el).parent();
        const companyText = parent.find('.job-company').text().replace(/vacancies/gi, '').trim() || 'Verified Employer';
        const loc = parent.find('.job-location').text().trim() || 'Tanzania';
        const jobTypeRaw = parent.find('.job-type').text().trim().toLowerCase();

        if (rawTitle && href) {
          const title = cleanText(rawTitle);
          const company = cleanText(companyText);
          const desc = `Authentic job opportunity in Tanzania: ${title} at ${company}. Interested candidates are advised to review the role responsibilities and submit required documentation directly before the application deadline.`;
          const reqs = `Candidates applying for the position of ${title} at ${company} must meet all required professional qualifications, demonstrate relevant industry experience, and adhere to regulatory standards in Tanzania.`;

          let jobType = 'full_time';
          if (jobTypeRaw.includes('contract')) jobType = 'contract';
          else if (jobTypeRaw.includes('intern')) jobType = 'internship';
          else if (jobTypeRaw.includes('part')) jobType = 'part_time';

          jobsToInsert.push({
            title: title.substring(0, 255),
            company_name: company.substring(0, 255),
            description: desc,
            requirements: reqs,
            location: loc.substring(0, 255),
            country_id: TZ_COUNTRY_ID,
            job_type: jobType,
            source_url: href,
            employer_url: 'https://ajirayako.co.tz',
            is_active: true,
            is_aggregator_source: true,
            posted_date: new Date().toISOString()
          });
        }
      });

      if (jobsToInsert.length > 0) {
        const count = await insertJobBatch(jobsToInsert);
        totalInserted += count;
        console.log(`[AjiraYako Page ${page}/${pages}] Found ${jobsToInsert.length} -> Inserted ${count} new jobs (Running total: ${totalInserted})`);
      }
    } catch (e) {
      console.warn(`[AjiraYako Page ${page}] warning: ${e.message}`);
    }
  }

  console.log(`\n🏁 AjiraYako harvest complete! Total new jobs inserted: ${totalInserted}`);
}

harvestAjiraYako(30).catch(err => console.error(err));
