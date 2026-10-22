import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pywienffahvmylssnorr.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5d2llbmZmYWh2bXlsc3Nub3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4OTM5OTMsImV4cCI6MjA5ODQ2OTk5M30.EzpyyED8RFFYbP9B9nPJXlL2ygdJH_QORfi2w-hx5A8';
  return createBrowserClient(url, key);
}
