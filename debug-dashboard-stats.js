const fetch = require('node-fetch');

async function debugDashboardStats() {
  console.log('🔍 Debugging Dashboard Stats API...');
  
  // Create a test user first
  const testUser = {
    supabaseId: 'debug-stats-' + Date.now(),
    email: 'debugstats' + Date.now() + '@example.com',
    name: 'Debug Stats User',
    phone: '+1234567893'
  };
  
  console.log('\n1. Creating test user...');
  try {
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const registerData = await registerResponse.json();
    
    if (registerResponse.status !== 200 || !registerData.success) {
      console.log('❌ Failed to create test user:', registerData.error);
      return;
    }
    
    const authToken = registerData.token;
    console.log('✅ Test user created successfully');
    
    console.log('\n2. Testing Dashboard Stats API...');
    const statsResponse = await fetch('http://localhost:3000/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response Status:', statsResponse.status);
    console.log('Response Headers:', Object.fromEntries(statsResponse.headers.entries()));
    
    const responseText = await statsResponse.text();
    console.log('Raw Response:', responseText);
    
    try {
      const statsData = JSON.parse(responseText);
      console.log('Parsed Response:', JSON.stringify(statsData, null, 2));
      
      if (statsResponse.status === 200 && statsData.success) {
        console.log('\n✅ Dashboard Stats API: WORKING');
        console.log('Stats Summary:');
        console.log('- Total Earnings:', statsData.stats.totalEarnings);
        console.log('- Total Referrals:', statsData.stats.totalReferrals);
        console.log('- Current Balance:', statsData.stats.currentBalance);
      } else {
        console.log('\n❌ Dashboard Stats API: FAILED');
        console.log('Error:', statsData.error || 'Unknown error');
      }
    } catch (parseError) {
      console.log('\n❌ Failed to parse JSON response:', parseError.message);
      console.log('This might indicate a server error or non-JSON response');
    }
    
  } catch (error) {
    console.log('❌ Network or request error:', error.message);
  }
}

debugDashboardStats();