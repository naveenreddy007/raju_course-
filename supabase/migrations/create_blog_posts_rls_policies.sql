-- Create RLS policies for blog_posts table

-- Policy to allow anonymous users to read published blog posts
CREATE POLICY "Allow anonymous users to read published blog posts" ON blog_posts
    FOR SELECT
    TO anon
    USING ("isPublished" = true);

-- Policy to allow authenticated users to read all blog posts
CREATE POLICY "Allow authenticated users to read all blog posts" ON blog_posts
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy to allow authenticated users to insert blog posts
CREATE POLICY "Allow authenticated users to insert blog posts" ON blog_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy to allow authenticated users to update their own blog posts
CREATE POLICY "Allow authenticated users to update blog posts" ON blog_posts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy to allow authenticated users to delete blog posts
CREATE POLICY "Allow authenticated users to delete blog posts" ON blog_posts
    FOR DELETE
    TO authenticated
    USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'blog_posts';