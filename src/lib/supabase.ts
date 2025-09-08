import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase Configuration
 * 
 * This file sets up the Supabase client for both client-side and server-side usage.
 * Make sure to configure your environment variables in .env file:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon/public key
 * - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (server-side only)
 */

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug logging
console.log('Supabase environment check:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey,
  url: supabaseUrl?.substring(0, 30) + '...',
  isServer: typeof window === 'undefined'
});

// Validation
if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
}
if (!supabaseAnonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * Client-side Supabase client
 * Used for authentication, real-time subscriptions, and client-side database operations
 */
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

/**
 * Server-side Supabase client with elevated privileges
 * Used for admin operations, bypassing RLS policies
 * Only available on the server-side with service role key
 */
export const supabaseAdmin = supabaseServiceKey 
  ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

/**
 * Create a new Supabase client instance
 * This function can be used to create fresh client instances when needed
 * For server-side operations, it returns the admin client with service role key
 */
export function createClient() {
  // For server-side operations, use admin client if available
  if (typeof window === 'undefined' && supabaseAdmin) {
    return supabaseAdmin;
  }
  return supabase;
}

/**
 * Create a new Supabase client instance (alternative export)
 */
export { supabase as createSupabaseInstance }

/**
 * Type definitions for better TypeScript support
 */
export type SupabaseClient = typeof supabase
export type SupabaseAdminClient = typeof supabaseAdmin