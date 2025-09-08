const { createClient } = require('@supabase/supabase-js');

async function testAdminClient() {
  console.log('Testing Supabase admin client...');
  
  try {
    // Test with service role key
    const supabaseAdmin = createClient(
      'https://yrpcgkrichksljfrtmvs.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycGNna3JpY2hrc2xqZnJ0bXZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIzMDczMiwiZXhwIjoyMDcyODA2NzMyfQ.qUEDtC9R5vBKmYjBMiQ5mO1rIuHp8Mc9OYd1kBvgaCk'
    );
    
    console.log('\n1. Testing admin blog posts query...');
    const { data: blogPosts, error: blogError } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .limit(5);
    
    if (blogError) {
      console.error('❌ Admin blog posts query error:', blogError);
    } else {
      console.log('✅ Admin blog posts query successful:', blogPosts?.length || 0, 'posts found');
    }
    
    console.log('\n2. Testing admin courses query...');
    const { data: courses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .limit(5);
    
    if (coursesError) {
      console.error('❌ Admin courses query error:', coursesError);
    } else {
      console.log('✅ Admin courses query successful:', courses?.length || 0, 'courses found');
    }
    
    console.log('\n3. Testing admin blog posts with count...');
    const { data: blogWithCount, error: blogCountError, count: blogCount } = await supabaseAdmin
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('isPublished', true)
      .limit(5);
    
    if (blogCountError) {
      console.error('❌ Admin blog count query error:', blogCountError);
    } else {
      console.log('✅ Admin blog count query successful. Count:', blogCount, 'Posts:', blogWithCount?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testAdminClient()