const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('='.repeat(60));
console.log('FIXING DATABASE PERMISSIONS');
console.log('='.repeat(60));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase URL or service role key in environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// SQL commands to fix permissions
const fixPermissionsSQL = `
-- Disable RLS temporarily for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE commissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE bank_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated and service roles
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Set default permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
`;

async function executeSQL(sql) {
  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      return false;
    }
    
    console.log('✅ SQL executed successfully');
    return true;
  } catch (error) {
    console.error('❌ Exception executing SQL:', error.message);
    return false;
  }
}

// Alternative approach using direct SQL execution if RPC is not available
async function executeDirectSQL() {
  try {
    // Split the SQL into individual statements
    const statements = fixPermissionsSQL.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        
        // This is a workaround since we can't execute arbitrary SQL directly
        // In a real scenario, you would use the Supabase dashboard or a direct DB connection
        console.log('⚠️  Note: This script cannot execute SQL directly. Please run the following SQL in the Supabase SQL editor:');
        console.log('\n' + statement.trim() + ';\n');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Exception in executeDirectSQL:', error.message);
    return false;
  }
}

async function main() {
  console.log('Attempting to fix database permissions...\n');
  
  // Try to execute SQL directly
  const success = await executeDirectSQL();
  
  if (success) {
    console.log('\n✅ Database permission fix script completed');
    console.log('\n⚠️  IMPORTANT: The SQL commands above need to be executed manually in the Supabase SQL editor:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy and paste the SQL commands shown above');
    console.log('5. Execute the query');
    console.log('6. Restart the development server');
  } else {
    console.log('\n❌ Failed to execute database permission fixes');
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('PERMISSION FIX COMPLETE');
  console.log('='.repeat(60));
}

main();