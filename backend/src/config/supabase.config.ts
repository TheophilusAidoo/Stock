import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://pptkoxlmocdmcbymxjix.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdGtveGxtb2NkbWNieW14aml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MDQ5MTMsImV4cCI6MjA4MDE4MDkxM30.XjG5nV_GeHczR6Q2PQxZlFE5N_Uv46yGRYE_YxFvhRM';
const DEFAULT_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdGtveGxtb2NkbWNieW14aml4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDYwNDkxMywiZXhwIjoyMDgwMTgwOTEzfQ.mnEF-aRU5UtCRSXm_5nYm0cqN-UCXf8yO9Ji2HEMafA';

function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
}

function getSupabaseAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON_KEY;
}

function getSupabaseServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? DEFAULT_SUPABASE_SERVICE_KEY;
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return supabaseClient;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!supabaseAdminClient) {
    const serviceKey = getSupabaseServiceKey();
    if (serviceKey) {
      supabaseAdminClient = createClient(getSupabaseUrl(), serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    } else {
      supabaseAdminClient = getSupabaseClient();
    }
  }
  return supabaseAdminClient;
}

