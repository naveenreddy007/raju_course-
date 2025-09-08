const { createClient } = require('@supabase/supabase-js');

async function testSupabaseQueries() {
  console.log('Testing basic Supabase queries...');
  
  try {
    const supabase = createClient(
      'https://yrpcgkrichksljfrtmvs.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycGNna3JpY2hrc2xqZnJ0bXZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyMzA3MzIsImV4cCI6MjA3MjgwNjczMn0.d5GQ3CMSYMDdHJNHHxsJrrxxmd_PqiBPvFjkW4U3FAk'
    );
    
    console.log('\n1. Testing simple blog posts query...');
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('*')
      .limit(5);
    
    if (blogError) {
      console.error('❌ Blog posts query error:', blogError);
    } else {
      console.log('✅ Blog posts query successful:', blogPosts?.length || 0, 'posts found');
    }
    
    console.log('\n2. Testing simple courses query...');
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(5);
    
    if (coursesError) {
      console.error('❌ Courses query error:', coursesError);
    } else {
      console.log('✅ Courses query successful:', courses?.length || 0, 'courses found');
    }
    
    console.log('\n3. Testing blog posts with count...');
    const { data: blogWithCount, error: blogCountError, count: blogCount } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .eq('isPublished', true)
      .limit(5);
    
    if (blogCountError) {
      console.error('❌ Blog count query error:', blogCountError);
    } else {
      console.log('✅ Blog count query successful. Count:', blogCount, 'Posts:', blogWithCount?.length || 0);
    }
    
    console.log('\n4. Testing courses with count...');
    const { data: coursesWithCount, error: coursesCountError, count: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('isPublished', true)
      .limit(5);
    
    if (coursesCountError) {
      console.error('❌ Courses count query error:', coursesCountError);
    } else {
      console.log('✅ Courses count query successful. Count:', coursesCount, 'Courses:', coursesWithCount?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testSupabaseQueries();