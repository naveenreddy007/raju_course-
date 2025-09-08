-- Refresh the PostgREST schema cache
-- This will force PostgREST to reload the schema information

-- Send a NOTIFY signal to refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Alternative approach: Update the schema version to force cache refresh
-- This creates a comment on the schema to trigger cache invalidation
COMMENT ON SCHEMA public IS 'Schema refreshed for blog_posts table access';

-- Verify the table exists and is accessible
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'blog_posts';