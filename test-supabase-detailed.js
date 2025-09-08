require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

console.log('='.repeat(60));
console.log('DETAILED SUPABASE CONNECTION TEST');
console.log('='.repeat(60));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\nEnvironment Variables:');
console.log('Supabase URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET');
console.log('Anon Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'NOT SET');
console.log('Service Key:', supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'NOT SET');

// Test anon client
async function testAnonClient() {
  console.log('\n1. Testing Anon Client Connection');
  console.log('-'.repeat(40));
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing URL or key');
    return false;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Anon client created successfully');
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Anon client query failed:');
      console.log('   Error code:', error.code);
      console.log('   Error message:', error.message);
      console.log('   Error details:', error.details);
      console.log('   Error hint:', error.hint);
      return false;
    } else {
      console.log('✅ Anon client query successful');
      console.log('   Count:', data);
      return true;
    }
  } catch (error) {
    console.log('❌ Anon client exception:');
    console.log('   Message:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
}

// Test service client
async function testServiceClient() {
  console.log('\n2. Testing Service Client Connection');
  console.log('-'.repeat(40));
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing URL or service key');
    return false;
  }
  
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Service client created successfully');
    
    // Test basic connection
    const { data, error } = await supabaseAdmin.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('❌ Service client query failed:');
      console.log('   Error code:', error.code);
      console.log('   Error message:', error.message);
      console.log('   Error details:', error.details);
      console.log('   Error hint:', error.hint);
      return false;
    } else {
      console.log('✅ Service client query successful');
      console.log('   Count:', data);
      return true;
    }
  } catch (error) {
    console.log('❌ Service client exception:');
    console.log('   Message:', error.message);
    console.log('   Stack:', error.stack);
    return false;
  }
}

// Test table existence
async function testTableExistence() {
  console.log('\n3. Testing Table Existence');
  console.log('-'.repeat(40));
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing URL or service key');
    return false;
  }
  
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // List of tables to check
    const tables = ['users', 'affiliates', 'transactions', 'courses', 'blog_posts'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin.from(table).select('count', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`✅ Table '${table}' exists (${data} records)`);
        }
      } catch (tableError) {
        console.log(`❌ Table '${table}': Exception - ${tableError.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Table existence test failed:');
    console.log('   Message:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const anonResult = await testAnonClient();
  const serviceResult = await testServiceClient();
  const tableResult = await testTableExistence();
  
  console.log('\n4. Summary');
  console.log('-'.repeat(40));
  console.log('Anon Client:', anonResult ? '✅ Working' : '❌ Failed');
  console.log('Service Client:', serviceResult ? '✅ Working' : '❌ Failed');
  console.log('Table Check:', tableResult ? '✅ Completed' : '❌ Failed');
  
  console.log('\n='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

runTests();