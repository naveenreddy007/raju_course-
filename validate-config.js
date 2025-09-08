require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

console.log('='.repeat(60));
console.log('SUPABASE CONFIGURATION VALIDATION REPORT');
console.log('='.repeat(60));

// 1. Environment Variables Validation
console.log('\n1. ENVIRONMENT VARIABLES VALIDATION');
console.log('-'.repeat(40));

const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'DATABASE_URL': process.env.DATABASE_URL,
  'DIRECT_URL': process.env.DIRECT_URL,
  'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
  'NEXTAUTH_URL': process.env.NEXTAUTH_URL,
  'NEXT_PUBLIC_RAZORPAY_KEY_ID': process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  'RAZORPAY_SECRET': process.env.RAZORPAY_SECRET,
  'SMTP_HOST': process.env.SMTP_HOST,
  'SMTP_PORT': process.env.SMTP_PORT,
  'SMTP_USER': process.env.SMTP_USER,
  'SMTP_PASS': process.env.SMTP_PASS,
  'KYC_API_KEY': process.env.KYC_API_KEY,
  'KYC_API_URL': process.env.KYC_API_URL,
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL
};

const missingVars = [];
const presentVars = [];

Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (value && value.trim() !== '') {
    presentVars.push(key);
    console.log(`✅ ${key}: Set`);
  } else {
    missingVars.push(key);
    console.log(`❌ ${key}: Missing or empty`);
  }
});

console.log(`\nSummary: ${presentVars.length}/${Object.keys(requiredEnvVars).length} environment variables are set`);

// 2. Database URL Validation
console.log('\n2. DATABASE URL VALIDATION');
console.log('-'.repeat(40));

const validateDatabaseUrl = (url) => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'postgresql:' && 
           urlObj.hostname && 
           urlObj.username && 
           urlObj.port;
  } catch (e) {
    return false;
  }
};

if (process.env.DATABASE_URL) {
  console.log(`DATABASE_URL format: ${validateDatabaseUrl(process.env.DATABASE_URL) ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`Uses connection pool: ${process.env.DATABASE_URL.includes('pgbouncer=true') ? '✅ Yes' : '❌ No'}`);
}

if (process.env.DIRECT_URL) {
  console.log(`DIRECT_URL format: ${validateDatabaseUrl(process.env.DIRECT_URL) ? '✅ Valid' : '❌ Invalid'}`);
}

// 3. Supabase Configuration Validation
console.log('\n3. SUPABASE CONFIGURATION VALIDATION');
console.log('-'.repeat(40));

const validateSupabaseUrl = (url) => {
  if (!url) return false;
  return url.startsWith('https://') && url.includes('.supabase.co');
};

const validateSupabaseKey = (key) => {
  if (!key) return false;
  try {
    const parts = key.split('.');
    return parts.length === 3 && parts[0].startsWith('eyJ');
  } catch (e) {
    return false;
  }
};

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log(`Supabase URL format: ${validateSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ? '✅ Valid' : '❌ Invalid'}`);
}

if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log(`Supabase Anon Key format: ${validateSupabaseKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ? '✅ Valid' : '❌ Invalid'}`);
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log(`Supabase Service Role Key format: ${validateSupabaseKey(process.env.SUPABASE_SERVICE_ROLE_KEY) ? '✅ Valid' : '❌ Invalid'}`);
}

// 4. Database Connectivity Test
console.log('\n4. DATABASE CONNECTIVITY TEST');
console.log('-'.repeat(40));

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('Testing Prisma database connection...');
    await prisma.$connect();
    console.log('✅ Prisma database connection successful');
    
    // Test basic query
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful - Found ${userCount} users`);
    
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    return false;
  }
}

// 5. Supabase Client Test
console.log('\n5. SUPABASE CLIENT TEST');
console.log('-'.repeat(40));

async function testSupabaseConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  let results = {
    anonClient: false,
    serviceClient: false,
    tablesAccessible: false
  };
  
  // Test anon client
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      console.log('Testing Supabase anon client...');
      
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Anon client error: ${error.message}`);
      } else {
        console.log('✅ Anon client connection successful');
        results.anonClient = true;
      }
    } catch (error) {
      console.log(`❌ Anon client creation failed: ${error.message}`);
    }
  }
  
  // Test service client
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      console.log('Testing Supabase service client...');
      
      const { data, error } = await supabaseAdmin.from('users').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Service client error: ${error.message}`);
      } else {
        console.log('✅ Service client connection successful');
        results.serviceClient = true;
        results.tablesAccessible = true;
      }
    } catch (error) {
      console.log(`❌ Service client creation failed: ${error.message}`);
    }
  }
  
  return results;
}

// 6. Security Check
console.log('\n6. SECURITY CHECK');
console.log('-'.repeat(40));

const performSecurityCheck = () => {
  let issues = [];
  
  // Check for weak secrets
  if (process.env.NEXTAUTH_SECRET === 'dev-secret-key-for-testing-only') {
    issues.push('NEXTAUTH_SECRET is using a weak test secret');
  }
  
  if (process.env.RAZORPAY_SECRET === 'test_secret_key_here') {
    issues.push('RAZORPAY_SECRET is using a placeholder value');
  }
  
  if (process.env.SMTP_USER === 'test@example.com') {
    issues.push('SMTP_USER is using a test email address');
  }
  
  // Check for exposed secrets in client-side vars
  const clientSideVars = [
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID'
  ];
  
  clientSideVars.forEach(varName => {
    if (process.env[varName] && process.env[varName].includes('test_')) {
      issues.push(`${varName} appears to be using test keys in client-side variables`);
    }
  });
  
  if (issues.length === 0) {
    console.log('✅ No obvious security issues found');
  } else {
    console.log('❌ Security issues found:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return issues;
};

// 7. Configuration Issues Summary
console.log('\n7. CONFIGURATION ISSUES SUMMARY');
console.log('-'.repeat(40));

// Run all tests
async function runAllTests() {
  const dbConnected = await testDatabaseConnection();
  const supabaseResults = await testSupabaseConnection();
  const securityIssues = performSecurityCheck();
  
  const allIssues = [];
  
  if (missingVars.length > 0) {
    allIssues.push(`Missing environment variables: ${missingVars.join(', ')}`);
  }
  
  if (!dbConnected) {
    allIssues.push('Database connection failed');
  }
  
  if (!supabaseResults.anonClient) {
    allIssues.push('Supabase anon client connection failed');
  }
  
  if (!supabaseResults.serviceClient) {
    allIssues.push('Supabase service client connection failed');
  }
  
  if (!supabaseResults.tablesAccessible) {
    allIssues.push('Supabase tables not accessible (permission denied)');
  }
  
  if (securityIssues.length > 0) {
    allIssues.push(`Security issues: ${securityIssues.join('; ')}`);
  }
  
  if (allIssues.length === 0) {
    console.log('✅ All tests passed - configuration appears to be working correctly');
  } else {
    console.log('❌ Issues found:');
    allIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  console.log('\n8. RECOMMENDATIONS');
  console.log('-'.repeat(40));
  
  if (missingVars.length > 0) {
    console.log('• Set all missing environment variables');
  }
  
  if (!supabaseResults.tablesAccessible) {
    console.log('• Check Row Level Security (RLS) policies in Supabase dashboard');
    console.log('• Ensure service role key has correct permissions');
    console.log('• Verify that tables exist in the database');
  }
  
  if (securityIssues.length > 0) {
    console.log('• Replace all test/placeholder values with production secrets');
    console.log('• Use environment-specific .env files for development and production');
    console.log('• Never commit secrets to version control');
  }
  
  if (!process.env.DATABASE_URL.includes('pgbouncer=true')) {
    console.log('• Use connection pooling (pgbouncer=true) for better performance');
  }
  
  console.log('\n='.repeat(60));
  console.log('VALIDATION COMPLETE');
  console.log('='.repeat(60));
}

runAllTests();