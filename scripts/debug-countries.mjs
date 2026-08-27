import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pywienffahvmylssnorr.supabase.co";
const SERVICE_KEY = "REDACTED_SERVICE_ROLE_KEY";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { data: countries } = await sb.from('countries').select('*');
  console.log("Countries in DB:", countries.map(c => `${c.code}: ${c.name} (${c.id})`));

  const { data: jobCounts } = await sb.from('jobs').select('country_id');
  const counts = {};
  for (const j of jobCounts || []) {
    counts[j.country_id] = (counts[j.country_id] || 0) + 1;
  }
  console.log("Job counts by country_id:", counts);
}
main();
