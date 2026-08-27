import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pywienffahvmylssnorr.supabase.co";
const SERVICE_KEY = "REDACTED_SERVICE_ROLE_KEY";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { data: jobCounts } = await sb.from('jobs').select('country_id', { count: 'exact' });
  const counts = {};
  for (const j of jobCounts || []) {
    counts[j.country_id] = (counts[j.country_id] || 0) + 1;
  }
  const { data: countries } = await sb.from('countries').select('id, name, code');
  
  countries.forEach(c => {
    console.log(`${c.code} (${c.name}): ${counts[c.id] || 0} jobs`);
  });
}
main();
