const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('🔍 Testing Authentication Flow Issues...');
  
  const testResults = {
    registration: { status: 'pending', issues: [] },
    login: { status: 'pending', issues: [] },
    apiAuth: { status: 'pending', issues: [] }
  };

  try {
    // Test 1: Registration API
    console.log('\n1. Testing Registration API...');
    
    const registrationData = {
      supabaseId: 'test-supabase-id-' + Date.now(),
      email: 'testuser' + Date.now() + '@example.com',
      name: 'Test User',
      phone: '9876543210',
      referralCode: null
    };

    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registrationData)
    });

    const registerResult = await registerResponse.json();
    console.log('Registration Response:', {
      status: registerResponse.status,
      success: registerResult.success,
      error: registerResult.error,
      details: registerResult.details
    });

    if (registerResponse.status === 200 && registerResult.success) {
      testResults.registration.status = 'passed';
      console.log('✅ Registration working correctly');
    } else {
      testResults.registration.status = 'failed';
      testResults.registration.issues.push(`Status: ${registerResponse.status}, Error: ${registerResult.error}`);
      console.log('❌ Registration failed:', registerResult.error);
    }

    // Test 2: Login API (using mock data since we can't test real Supabase auth)
    console.log('\n2. Testing Login API structure...');
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });

    const loginResult = await loginResponse.json();
    console.log('Login Response:', {
      status: loginResponse.status,
      error: loginResult.error
    });

    // Expected to fail with 401 due to invalid credentials, but should not be 500
    if (loginResponse.status === 401) {
      testResults.login.status = 'passed';
      console.log('✅ Login API structure working (401 expected for invalid credentials)');
    } else if (loginResponse.status === 500) {
      testResults.login.status = 'failed';
      testResults.login.issues.push('Internal server error in login API');
      console.log('❌ Login API has internal server error');
    } else {
      testResults.login.status = 'unknown';
      testResults.login.issues.push(`Unexpected status: ${loginResponse.status}`);
    }

    // Test 3: API Authentication with requireAuth
    console.log('\n3. Testing API Authentication...');
    
    // Test without token
    const noTokenResponse = await fetch(`${BASE_URL}/api/user/profile`);
    const noTokenResult = await noTokenResponse.json();
    
    console.log('No Token Response:', {
      status: noTokenResponse.status,
      error: noTokenResult.error
    });

    if (noTokenResponse.status === 401) {
      console.log('✅ API correctly rejects requests without token');
    } else {
      testResults.apiAuth.issues.push('API should return 401 for requests without token');
    }

    // Test with invalid token
    const invalidTokenResponse = await fetch(`${BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    const invalidTokenResult = await invalidTokenResponse.json();
    console.log('Invalid Token Response:', {
      status: invalidTokenResponse.status,
      error: invalidTokenResult.error
    });

    if (invalidTokenResponse.status === 401) {
      testResults.apiAuth.status = 'passed';
      console.log('✅ API correctly rejects invalid tokens');
    } else {
      testResults.apiAuth.status = 'failed';
      testResults.apiAuth.issues.push('API should return 401 for invalid tokens');
    }

    // Test 4: Database connectivity
    console.log('\n4. Testing Database Connectivity...');
    
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database connected. Total users: ${userCount}`);
    } catch (dbError) {
      console.log('❌ Database connection error:', dbError.message);
      testResults.registration.issues.push('Database connectivity issue');
      testResults.login.issues.push('Database connectivity issue');
    }

    // Test 5: Environment variables
    console.log('\n5. Checking Environment Variables...');
    
    const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const missingEnvVars = [];
    
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        missingEnvVars.push(envVar);
      }
    });

    if (missingEnvVars.length === 0) {
      console.log('✅ All required environment variables are set');
    } else {
      console.log('❌ Missing environment variables:', missingEnvVars);
      testResults.registration.issues.push(`Missing env vars: ${missingEnvVars.join(', ')}`);
      testResults.login.issues.push(`Missing env vars: ${missingEnvVars.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Test execution error:', error.message);
    testResults.registration.issues.push(`Test error: ${error.message}`);
    testResults.login.issues.push(`Test error: ${error.message}`);
  }

  // Summary
  console.log('\n📊 Authentication Test Summary:');
  console.log('================================');
  
  Object.entries(testResults).forEach(([test, result]) => {
    const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
    console.log(`${status} ${test.toUpperCase()}: ${result.status}`);
    
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    }
  });

  await prisma.$disconnect();
  
  return testResults;
}

if (require.main === module) {
  testAuthFlow().catch(console.error);
}

module.exports = { testAuthFlow };