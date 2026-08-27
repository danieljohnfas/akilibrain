import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pywienffahvmylssnorr.supabase.co";
const SERVICE_KEY = "REDACTED_SERVICE_ROLE_KEY";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { data: countries } = await sb.from('countries').select('id, name');
  const cMap = {};
  countries.forEach(c => cMap[c.id] = c.name);

  // Get jobs containing 'Senegal' or 'Nigeria' in the title or description
  const { data: jobs, error } = await sb.from('jobs')
    .select('title, country_id')
    .ilike('title', '%Nigeria%')
    .limit(10);
    
  console.log("Jobs with Nigeria in title:", jobs.map(j => `${j.title} (Country: ${cMap[j.country_id] || j.country_id})`));
}
main();
