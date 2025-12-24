import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'
import type { Database } from './database.types'

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // Always log environment variable errors (critical for setup)
  logger.error('Missing Supabase environment variables!')
  logger.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  logger.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
}

// Create Supabase client with better error handling
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Clear invalid tokens automatically
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
)
