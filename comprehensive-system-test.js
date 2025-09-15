const fetch = require('node-fetch');

async function comprehensiveSystemTest() {
  console.log('🔍 Running Comprehensive System Test...');
  
  let testResults = {
    registration: false,
    login: false,
    referrals: false,
    userProfile: false,
    dashboardStats: false,
    dashboardEarnings: false,
    dashboardCourses: false
  };
  
  // Create a test user
  const testUser = {
    supabaseId: 'comprehensive-test-' + Date.now(),
    email: 'comprehensive' + Date.now() + '@example.com',
    name: 'Comprehensive Test User',
    phone: '+1234567892'
  };
  
  let authToken;
  
  console.log('\n1. Testing User Registration...');
  try {
    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const registerData = await registerResponse.json();
    
    if (registerResponse.status === 200 && registerData.success) {
      authToken = registerData.token;
      testResults.registration = true;
      console.log('✅ Registration: PASSED');
    } else {
      console.log('❌ Registration: FAILED -', registerData.error);
      return testResults;
    }
  } catch (error) {
    console.log('❌ Registration: ERROR -', error.message);
    return testResults;
  }
  
  console.log('\n2. Testing User Profile API...');
  try {
    const profileResponse = await fetch('http://localhost:3000/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    const profileData = await profileResponse.json();
    
    if (profileResponse.status === 200 && profileData.success) {
      testResults.userProfile = true;
      console.log('✅ User Profile: PASSED');
    } else {
      console.log('❌ User Profile: FAILED -', profileData.error);
    }
  } catch (error) {
    console.log('❌ User Profile: ERROR -', error.message);
  }
  
  console.log('\n3. Testing Referrals API...');
  try {
    const referralsResponse = await fetch('http://localhost:3000/api/referrals', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    const referralsData = await referralsResponse.json();
    
    if (referralsResponse.status === 200 && referralsData.success) {
      testResults.referrals = true;
      console.log('✅ Referrals: PASSED');
    } else {
      console.log('❌ Referrals: FAILED -', referralsData.error);
    }
  } catch (error) {
    console.log('❌ Referrals: ERROR -', error.message);
  }
  
  console.log('\n4. Testing Dashboard Stats API...');
  try {
    const statsResponse = await fetch('http://localhost:3000/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    const statsData = await statsResponse.json();
    
    if (statsResponse.status === 200 && statsData.success !== false) {
      testResults.dashboardStats = true;
      console.log('✅ Dashboard Stats: PASSED');
    } else {
      console.log('❌ Dashboard Stats: FAILED -', statsData.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Dashboard Stats: ERROR -', error.message);
  }
  
  console.log('\n5. Testing Dashboard Earnings API...');
  try {
    const earningsResponse = await fetch('http://localhost:3000/api/dashboard/earnings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    const earningsData = await earningsResponse.json();
    
    if (earningsResponse.status === 200 && earningsData.success !== false) {
      testResults.dashboardEarnings = true;
      console.log('✅ Dashboard Earnings: PASSED');
    } else {
      console.log('❌ Dashboard Earnings: FAILED -', earningsData.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Dashboard Earnings: ERROR -', error.message);
  }
  
  console.log('\n6. Testing Dashboard Courses API...');
  try {
    const coursesResponse = await fetch('http://localhost:3000/api/dashboard/courses', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    const coursesData = await coursesResponse.json();
    
    if (coursesResponse.status === 200 && coursesData.success !== false) {
      testResults.dashboardCourses = true;
      console.log('✅ Dashboard Courses: PASSED');
    } else {
      console.log('❌ Dashboard Courses: FAILED -', coursesData.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Dashboard Courses: ERROR -', error.message);
  }
  
  // Calculate success rate
  const totalTests = Object.keys(testResults).length;
  const passedTests = Object.values(testResults).filter(result => result === true).length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log('\n📊 Comprehensive System Test Results:');
  console.log('=====================================');
  console.log(`Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  console.log('\nDetailed Results:');
  Object.entries(testResults).forEach(([test, result]) => {
    console.log(`  ${result ? '✅' : '❌'} ${test}: ${result ? 'PASSED' : 'FAILED'}`);
  });
  
  if (successRate >= 85) {
    console.log('\n🎉 System is stable and ready for production!');
  } else if (successRate >= 70) {
    console.log('\n⚠️ System is mostly stable but needs some improvements.');
  } else {
    console.log('\n🚨 System needs significant improvements before production.');
  }
  
  return testResults;
}

comprehensiveSystemTest();