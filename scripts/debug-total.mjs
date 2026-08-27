import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pywienffahvmylssnorr.supabase.co";
const SERVICE_KEY = "REDACTED_SERVICE_ROLE_KEY";
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  const { count, error } = await sb.from('jobs').select('*', { count: 'exact', head: true });
  console.log("Total jobs in DB:", count, "Error:", error);
}
main();
