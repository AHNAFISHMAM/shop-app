import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'
import type { Database } from './database.types'

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // Always log environment variable errors (critical for setup)
  logger.error('Missing Supabase environment variables!')
  logger.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  logger.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing')
  
  // Show user-friendly error in console
  if (typeof window !== 'undefined') {
    console.error(
      '%c⚠️ Missing Supabase Configuration',
      'color: red; font-size: 16px; font-weight: bold;'
    )
    console.error(
      'Please create a .env file in the buildfast-shop directory with:',
      '\nVITE_SUPABASE_URL=your-project-url',
      '\nVITE_SUPABASE_ANON_KEY=your-anon-key'
    )
  }
}

// Create Supabase client with better error handling
// Use fallback values to prevent crashes, but operations will fail gracefully
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
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
