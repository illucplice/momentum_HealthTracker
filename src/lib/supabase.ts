import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly and specifically instead of letting every data call blow up
  // downstream with a generic "Failed to fetch" once requests start hitting
  // "undefined/rest/v1/...".
  throw new Error(
    'Missing Supabase configuration. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set — ' +
    'check that a .env file with these values exists in the project root (next to package.json), ' +
    'or that they are set as environment variables on your hosting provider.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
    },
  }
);