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

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json'
};

async function purgeSynthetic() {
  console.log('=== STARTING PURGE OF SYNTHETIC DATA ===');

  // 1. Delete jobs where source_url LIKE *verified-jobs*
  console.log('Purging synthetic jobs with source_url matching *verified-jobs*...');
  const delRes1 = await fetch(`${SUPABASE_URL}/rest/v1/jobs?source_url=like.*verified-jobs*`, {
    method: 'DELETE',
    headers: { ...HEADERS, Prefer: 'return=representation' }
  });

  if (!delRes1.ok) {
    console.error('Failed to delete synthetic verified-jobs:', await delRes1.text());
  } else {
    const deleted1 = await delRes1.json();
    console.log(`Deleted ${deleted1.length} synthetic jobs.`);
  }

  // 2. Delete corrupt job id 55c942b8-88ca-4614-8bce-cafa3ad920c6
  console.log('Purging corrupted blogger test job...');
  const delRes2 = await fetch(`${SUPABASE_URL}/rest/v1/jobs?id=eq.55c942b8-88ca-4614-8bce-cafa3ad920c6`, {
    method: 'DELETE',
    headers: { ...HEADERS, Prefer: 'return=representation' }
  });
  if (delRes2.ok) {
    const deleted2 = await delRes2.json();
    console.log(`Deleted ${deleted2.length} corrupted test job.`);
  }

  // 3. Verify remaining jobs
  const resCount = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=id`, {
    headers: { ...HEADERS, Range: '0-0', Prefer: 'count=exact' }
  });
  const remainingCount = resCount.headers.get('content-range')?.split('/')[1] || 'unknown';
  console.log(`Remaining jobs in Supabase: ${remainingCount}`);

  // 4. Sample remaining jobs to verify genuine external sources
  const sampleRes = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=title,company_name,source_url&limit=10`, {
    headers: HEADERS
  });
  const sample = await sampleRes.json();
  console.log('\nVerified genuine jobs sample:');
  sample.forEach((j, i) => {
    console.log(`[${i+1}] ${j.title} @ ${j.company_name} -> ${j.source_url}`);
  });

  console.log('=== SYNTHETIC PURGE COMPLETE ===');
}

purgeSynthetic().catch(err => console.error(err));
