const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yrpcgkrichksljfrtmvs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlycGNna3JpY2hrc2xqZnJ0bXZzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzIzMDczMiwiZXhwIjoyMDcyODA2NzMyfQ.qUEDtC9R5vBKmYjBMiQ5mO1rIuHp8Mc9OYd1kBvgaCk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection by querying users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Users table query failed:', usersError.message);
    } else {
      console.log('✅ Users table accessible via Supabase client');
    }
    
    // Test blog_posts table
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('count')
      .limit(1);
    
    if (blogError) {
      console.error('❌ Blog posts table query failed:', blogError.message);
    } else {
      console.log('✅ Blog posts table accessible via Supabase client');
    }
    
    // Test courses table
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('count')
      .limit(1);
    
    if (coursesError) {
      console.error('❌ Courses table query failed:', coursesError.message);
    } else {
      console.log('✅ Courses table accessible via Supabase client');
    }
    
    // List all tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables');
    
    if (tablesError) {
      console.log('ℹ️  Could not list tables (this is normal if RPC function doesn\'t exist)');
    } else {
      console.log('📋 Available tables:', tables);
    }
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message);
  }
}

testSupabaseConnection();