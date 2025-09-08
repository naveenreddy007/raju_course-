require('dotenv').config();

const BASE_URL = 'http://localhost:3002';

async function testEndpoint(name, url, options = {}) {
  try {
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`📍 URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    let data;
    try {
      const responseClone = response.clone();
      data = await responseClone.json();
      console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    } catch (e) {
      try {
        const text = await response.text();
        console.log(`📄 Response (text):`, text);
      } catch (e2) {
        console.log(`📄 Response: Could not read response body`);
      }
    }
    
    if (response.ok) {
      console.log(`✅ PASSED: ${name}`);
      return { success: true, data, response };
    } else {
      console.log(`❌ FAILED: ${name}`);
      return { success: false, data, response };
    }
  } catch (error) {
    console.log(`❌ ERROR: ${name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 SIMPLE ENDPOINT TESTING');
  console.log('===========================');
  
  // Test 1: Health check
  await testEndpoint('Health Check', `${BASE_URL}/`);
  
  // Test 2: Registration
  await testEndpoint('User Registration', `${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      phone: '+1234567890',
      password: 'testpass123',
      referralCode: 'INST001'
    })
  });
  
  // Test 3: Login
  const loginResult = await testEndpoint('Admin Login', `${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123'
    })
  });
  
  let token = null;
  if (loginResult.success && loginResult.data?.token) {
    token = loginResult.data.token;
    console.log(`🔑 Got token: ${token.substring(0, 20)}...`);
  }
  
  // Test 4: Courses
  await testEndpoint('Get Courses', `${BASE_URL}/api/courses`);
  
  // Test 5: Blog
  await testEndpoint('Get Blog Posts', `${BASE_URL}/api/blog`);
  
  // Test 6: Newsletter
  await testEndpoint('Newsletter Subscription', `${BASE_URL}/api/newsletter/subscribe`, {
    method: 'POST',
    body: JSON.stringify({
      email: `newsletter${Date.now()}@example.com`
    })
  });
  
  // Test 7: Protected endpoint (if we have token)
  if (token) {
    await testEndpoint('Dashboard Stats', `${BASE_URL}/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
  
  console.log('\n🎉 TESTING COMPLETED!');
}

runTests();