const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);

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

  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message);
  }
}

testSupabaseConnection();
