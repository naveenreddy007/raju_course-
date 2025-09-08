// Re-export all Supabase related utilities from a single entry point
export { 
  supabase, 
  supabaseAdmin, 
  createClient, 
  createSupabaseInstance,
  type SupabaseClient,
  type SupabaseAdminClient 
} from '../supabase';

// Re-export server-side utilities
export { createClient as createServerClient, createAdminClient } from './server';