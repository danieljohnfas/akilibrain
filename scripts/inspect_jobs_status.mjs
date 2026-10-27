import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), 'akilibrain', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const k = key.trim();
      if (!process.env[k]) {
        process.env[k] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pywienffahvmylssnorr.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'count=exact'
};

async function inspectJobs() {
  console.log('--- INSPECTING SUPABASE JOBS ---');

  // Total count
  const resTotal = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=id`, {
    headers: { ...HEADERS, Range: '0-0' }
  });
  const totalCount = resTotal.headers.get('content-range')?.split('/')[1] || 'unknown';
  console.log(`Total jobs in database: ${totalCount}`);

  // Synthetic count (source_url like *verified-jobs*)
  const resSynthetic = await fetch(`${SUPABASE_URL}/rest/v1/jobs?source_url=like.*verified-jobs*&select=id`, {
    headers: { ...HEADERS, Range: '0-0' }
  });
  const syntheticCount = resSynthetic.headers.get('content-range')?.split('/')[1] || '0';
  console.log(`Synthetic jobs (verified-jobs): ${syntheticCount}`);

  // Check any test / placeholder jobs
  const resTest = await fetch(`${SUPABASE_URL}/rest/v1/jobs?or=(title.ilike.*test*,company_name.ilike.*test*,company_name.ilike.*sample*,source_url.ilike.*example.com*)&select=id,title,company_name,source_url`, {
    headers: HEADERS
  });
  const testJobs = await resTest.json();
  console.log(`Test / sample pattern jobs count: ${testJobs.length}`);
  if (testJobs.length > 0) {
    console.log('Sample test jobs:', testJobs.slice(0, 3));
  }

  // Sample real jobs
  const resRealSample = await fetch(`${SUPABASE_URL}/rest/v1/jobs?source_url=not.like.*verified-jobs*&select=id,title,company_name,source_url&limit=5`, {
    headers: HEADERS
  });
  const realSample = await resRealSample.json();
  console.log('\nSample Genuine Scraped Jobs in DB:');
  console.log(realSample);
}

inspectJobs().catch(e => console.error(e));
