import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Modern OAuth flow: the session comes back in the URL and is exchanged
      // client-side. The legacy implicit flow (the default here) depends on
      // cookie/session state surviving the Google round-trip, which strict
      // browsers break — leaving users signed out (login button still showing)
      // even after Google completes.
      flowType: 'pkce',
    },
  }
);

export default supabase;
