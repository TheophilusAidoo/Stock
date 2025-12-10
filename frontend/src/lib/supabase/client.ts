import { createBrowserClient } from '@supabase/ssr';

// Fallback to provided Supabase credentials when env vars are missing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://pptkoxlmocdmcbymxjix.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdGtveGxtb2NkbWNieW14aml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDQ5MTMsImV4cCI6MjA4MDE4MDkxM30.XjG5nV_GeHczR6Q2PQxZlFE5N_Uv46yGRYE_YxFvhRM';

export function createClient() {
  return createBrowserClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}












