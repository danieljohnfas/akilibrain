vercel env add NEXT_PUBLIC_SUPABASE_URL production --type config --value "https://pywienffahvmylssnorr.supabase.co" --yes --force
vercel env add DATABASE_URL production --type secret --value "postgresql://postgres.pywienffahvmylssnorr:REDACTED_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres" --yes --force
vercel env add DIRECT_URL production --type secret --value "postgresql://postgres.pywienffahvmylssnorr:REDACTED_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres" --yes --force
vercel env add SUPABASE_SERVICE_ROLE_KEY production --type secret --value "REDACTED_SERVICE_ROLE_KEY" --yes --force
vercel env add TYPESAFE_API_KEY production --type secret --value "apikey_2252147817c67524a9681a28eabd8fe9a39_6caff1c08b96920c7ba8516d8bf49874143c05c409ea814864869e4cbe968012" --yes --force
vercel --prod --yes