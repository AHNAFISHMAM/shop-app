import { supabase } from '../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../lib/database.types';

/**
 * Hook to get Supabase client instance
 */
export function useSupabase(): { supabase: SupabaseClient<Database> } {
  return { supabase };
}

