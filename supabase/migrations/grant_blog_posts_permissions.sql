-- Grant permissions for blog_posts table to anon and authenticated roles

-- Grant SELECT permission to anon role (for public reading)
GRANT SELECT ON blog_posts TO anon;

-- Grant full permissions to authenticated role (for authenticated users)
GRANT ALL PRIVILEGES ON blog_posts TO authenticated;

-- Verify the grants
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'blog_posts' 
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;