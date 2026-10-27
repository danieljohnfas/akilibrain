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
  'Content-Type': 'application/json',
  Prefer: 'count=exact'
};

async function auditTable(tableName, selectField = 'id', extraFilter = '') {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=${selectField}${extraFilter}&limit=1`;
  const res = await fetch(url, { headers: { ...HEADERS, Range: '0-0' } });
  const count = res.headers.get('content-range')?.split('/')[1] || '0';
  return count;
}

async function run() {
  console.log('--- AUDITING ALL AKILIBRAIN TABLES ---');
  const tables = [
    'jobs',
    'tenders',
    'businesses',
    'compliance_requirements',
    'salary_submissions',
    'health_indicators',
    'health_data_points',
    'countries'
  ];

  for (const t of tables) {
    try {
      const count = await auditTable(t);
      console.log(`Table ${t.padEnd(25)}: ${count} rows`);
    } catch (e) {
      console.log(`Table ${t.padEnd(25)}: error (${e.message})`);
    }
  }

  // Check sample tenders
  const resTenders = await fetch(`${SUPABASE_URL}/rest/v1/tenders?select=id,title,source_url,organization&limit=3`, { headers: HEADERS });
  console.log('\nSample Tenders:', await resTenders.json());

  // Check sample compliance
  const resCompliance = await fetch(`${SUPABASE_URL}/rest/v1/compliance_requirements?select=id,title,source_url,authority&limit=3`, { headers: HEADERS });
  console.log('\nSample Compliance:', await resCompliance.json());

  // Check sample businesses
  const resBiz = await fetch(`${SUPABASE_URL}/rest/v1/businesses?select=id,name,registration_number&limit=3`, { headers: HEADERS });
  console.log('\nSample Businesses:', await resBiz.json());
}

run();
