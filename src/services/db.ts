import { createClient } from '@supabase/supabase-js';

// Read from environment variables (set in Render dashboard or .env file)
// Falls back to the original hardcoded values if env vars are not set
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://oiavrhipgprwfmbaqfdx.supabase.co';

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_spd3qPw2v1MoIh7qmjSe_A_kwTtzbW9';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Utility: test whether the Supabase project is reachable.
 * Returns true if the connection works, false if it fails.
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    // PGRST116 = no rows is fine — table exists and is reachable
    if (error && error.code !== 'PGRST116') {
      console.warn('[db] Connection test failed:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[db] Connection test threw an exception:', e);
    return false;
  }
};
