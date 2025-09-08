-- Force PostgREST schema reload by updating configuration
-- This should resolve PGRST205 error: "Could not find the table 'public.blog_posts' in the schema cache"

-- First, let's verify the table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'blog_posts' AND table_schema = 'public';

-- Force schema reload by sending SIGUSR1 signal to PostgREST
-- This is equivalent to restarting PostgREST
NOTIFY pgrst, 'reload schema';

-- Alternative: Update a system table to force cache invalidation
COMMENT ON TABLE public.blog_posts IS 'Blog posts table - cache refresh';

-- Verify table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blog_posts' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if RLS is properly configured
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'blog_posts' AND schemaname = 'public';

-- List all policies on the table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'blog_posts' AND schemaname = 'public';