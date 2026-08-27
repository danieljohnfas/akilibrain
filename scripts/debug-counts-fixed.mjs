import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pywienffahvmylssnorr.supabase.co";
const SERVICE_KEY = "REDACTED_SERVICE_ROLE_KEY";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { data: countries } = await sb.from('countries').select('id, name, code');
  
  for (const c of countries) {
    const { count } = await sb.from('jobs').select('id', { count: 'exact', head: true }).eq('country_id', c.id);
    console.log(`${c.code} (${c.name}): ${count} jobs`);
  }
}
main();
