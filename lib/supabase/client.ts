import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error('Supabase URL or Anon Key is missing in environmental variables.');
  }

  client = createBrowserClient(url, key, {
    auth: {
      persistSession: false, // Clerk handles auth, no need for Supabase session locks
      autoRefreshToken: false,
    }
  });

  return client;
}
