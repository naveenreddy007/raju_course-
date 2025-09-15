import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearDemoData() {
  try {
    console.log('🧹 Clearing existing demo data...');
    
    // Clear in reverse dependency order
    await supabase.from('commissions').delete().neq('id', 'never_match');
    console.log('✅ Cleared commissions');
    
    await supabase.from('referrals').delete().neq('id', 'never_match');
    console.log('✅ Cleared referrals');
    
    await supabase.from('transactions').delete().neq('id', 'never_match');
    console.log('✅ Cleared transactions');
    
    await supabase.from('package_purchases').delete().neq('id', 'never_match');
    console.log('✅ Cleared package_purchases');
    
    await supabase.from('affiliates').delete().neq('id', 'never_match');
    console.log('✅ Cleared affiliates');
    
    await supabase.from('blog_posts').delete().neq('id', 'never_match');
    console.log('✅ Cleared blog posts');
    
    await supabase.from('users').delete().neq('id', 'never_match');
    console.log('✅ Cleared users');
    
    await supabase.from('courses').delete().neq('id', 'never_match');
    console.log('✅ Cleared courses');
    
    await supabase.from('packages').delete().neq('id', 'never_match');
    console.log('✅ Cleared packages');
    
    console.log('🎉 All demo data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing demo data:', error);
    process.exit(1);
  }
}

clearDemoData();