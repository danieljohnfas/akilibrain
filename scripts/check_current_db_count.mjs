import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

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

const headers = { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'count=exact' };
const res = await fetch('https://pywienffahvmylssnorr.supabase.co/rest/v1/jobs?select=id', {
  headers: { ...headers, Range: '0-0' }
});
console.log('Current genuine jobs in Supabase:', res.headers.get('content-range')?.split('/')[1]);

const resByComp = await fetch('https://pywienffahvmylssnorr.supabase.co/rest/v1/jobs?select=company_name,country_id&limit=1000', { headers });
const jobs = await resByComp.json();
const compCounts = {};
for (const j of jobs) {
  compCounts[j.company_name] = (compCounts[j.company_name] || 0) + 1;
}
console.log('Sample top employers in DB:');
console.log(Object.entries(compCounts).sort((a,b) => b[1] - a[1]).slice(0, 15));
