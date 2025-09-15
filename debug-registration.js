const fetch = require('node-fetch');

async function testRegistration() {
  console.log('🔍 Testing Registration API in detail...');
  
  const testData = {
    supabaseId: 'test-supabase-id-' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    name: 'Test User',
    phone: '+1234567890',
    referralCode: null
  };
  
  console.log('Test data:', testData);
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log('Failed to parse JSON response:', e.message);
      return;
    }
    
    console.log('Registration Response:', {
      status: response.status,
      success: responseData.success,
      error: responseData.error,
      details: responseData.details,
    });
    
    if (response.status === 500) {
      console.log('❌ Registration failed with 500 error');
    } else if (response.status === 200 || response.status === 201) {
      console.log('✅ Registration successful');
    } else {
      console.log(`⚠️ Registration returned status ${response.status}`);
    }
    
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

testRegistration();