// Test environment variables loading
console.log('Testing environment variables...');

// Load environment variables
require('dotenv').config();

console.log('\nEnvironment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Service role key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
}

// Test creating supabase client
const { createClient } = require('@supabase/supabase-js');

try {
  const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      )
    : null;
  
  console.log('\nSupabase admin client:', supabaseAdmin ? '✅ Created' : '❌ Failed to create');
  
  if (supabaseAdmin) {
    console.log('Testing admin client query...');
    supabaseAdmin
      .from('blog_posts')
      .select('*')
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Admin query error:', error);
        } else {
          console.log('✅ Admin query successful');
        }
      });
  }
} catch (error) {
  console.error('❌ Error creating admin client:', error);
}