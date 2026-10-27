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

const headers = { apikey: key, Authorization: 'Bearer ' + key };
const res = await fetch('https://pywienffahvmylssnorr.supabase.co/rest/v1/countries?select=id,code,name&order=code.asc', { headers });
const data = await res.json();
console.log('Available Countries:', data);
