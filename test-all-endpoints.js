require('dotenv').config();

const BASE_URL = 'http://localhost:3000';

// Test credentials from our seeded data
const TEST_USERS = {
  admin: { email: 'admin@example.com', password: 'admin123' },
  instructor: { email: 'instructor@example.com', password: 'instructor123' },
  student: { email: 'student@example.com', password: 'student123' }
};

class EndpointTester {
  constructor() {
    this.tokens = {};
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp.split('T')[1].split('.')[0]}] ${message}`);
  }

  async test(name, testFn) {
    try {
      await this.log(`Testing: ${name}`, 'info');
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      await this.log(`PASSED: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      await this.log(`FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json().catch(() => ({}));
    
    return { response, data };
  }

  async authenticateUser(userType) {
    const user = TEST_USERS[userType];
    const { response, data } = await this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(user)
    });

    if (response.ok && data.token) {
      this.tokens[userType] = data.token;
      return data.token;
    }
    throw new Error(`Failed to authenticate ${userType}: ${data.error || 'Unknown error'}`);
  }

  async runAllTests() {
    console.log('🚀 COMPREHENSIVE ENDPOINT TESTING');
    console.log('==================================\n');

    // Test 1: Health Check
    await this.test('Server Health Check', async () => {
      const { response } = await this.makeRequest('/');
      if (!response.ok) throw new Error(`Server not responding: ${response.status}`);
    });

    // Test 2: Authentication Endpoints
    await this.test('User Registration', async () => {
      const newUser = {
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        phone: '+1234567890',
        password: 'testpass123',
        referralCode: 'INST001'
      };
      
      const { response, data } = await this.makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      
      if (!response.ok) throw new Error(`Registration failed: ${data.error}`);
      if (!data.success) throw new Error('Registration response invalid');
    });

    await this.test('Admin Login', async () => {
      await this.authenticateUser('admin');
    });

    await this.test('Instructor Login', async () => {
      await this.authenticateUser('instructor');
    });

    await this.test('Student Login', async () => {
      await this.authenticateUser('student');
    });

    // Test 3: Public Endpoints
    await this.test('Get All Courses (Public)', async () => {
      const { response, data } = await this.makeRequest('/api/courses');
      if (!response.ok) throw new Error(`Failed to fetch courses: ${data.error}`);
      if (!Array.isArray(data.data)) throw new Error('Courses data is not an array');
    });

    await this.test('Get Course by ID', async () => {
      // First get a course ID
      const { data: coursesData } = await this.makeRequest('/api/courses');
      if (coursesData.data.length === 0) throw new Error('No courses available for testing');
      
      const courseId = coursesData.data[0].id;
      const { response, data } = await this.makeRequest(`/api/courses/${courseId}`);
      if (!response.ok) throw new Error(`Failed to fetch course: ${data.error}`);
      if (!data.data) throw new Error('Course data is missing');
    });

    await this.test('Get Blog Posts', async () => {
      const { response, data } = await this.makeRequest('/api/blog');
      if (!response.ok) throw new Error(`Failed to fetch blog posts: ${data.error}`);
      if (!Array.isArray(data.data)) throw new Error('Blog posts data is not an array');
    });

    // Test 4: Protected Endpoints (Student)
    if (this.tokens.student) {
      await this.test('Dashboard Stats (Student)', async () => {
        const { response, data } = await this.makeRequest('/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${this.tokens.student}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch dashboard stats: ${data.error}`);
        if (!data.data) throw new Error('Dashboard stats data is missing');
      });

      await this.test('Dashboard Courses (Student)', async () => {
        const { response, data } = await this.makeRequest('/api/dashboard/courses', {
          headers: { Authorization: `Bearer ${this.tokens.student}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch dashboard courses: ${data.error}`);
        if (!Array.isArray(data.data)) throw new Error('Dashboard courses data is not an array');
      });

      await this.test('Dashboard Earnings (Student)', async () => {
        const { response, data } = await this.makeRequest('/api/dashboard/earnings', {
          headers: { Authorization: `Bearer ${this.tokens.student}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch earnings: ${data.error}`);
        if (!data.data) throw new Error('Earnings data is missing');
      });
    }

    // Test 5: Admin Endpoints
    if (this.tokens.admin) {
      await this.test('Admin - Get All Users', async () => {
        const { response, data } = await this.makeRequest('/api/admin/users', {
          headers: { Authorization: `Bearer ${this.tokens.admin}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch users: ${data.error}`);
        if (!Array.isArray(data.data)) throw new Error('Users data is not an array');
      });

      await this.test('Admin - Get All Courses', async () => {
        const { response, data } = await this.makeRequest('/api/admin/courses', {
          headers: { Authorization: `Bearer ${this.tokens.admin}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch admin courses: ${data.error}`);
        if (!Array.isArray(data.data)) throw new Error('Admin courses data is not an array');
      });

      await this.test('Admin - Create Course', async () => {
        const newCourse = {
          title: 'Test Course',
          description: 'This is a test course',
          price: 1999,
          level: 'BEGINNER',
          category: 'Test',
          duration: 20,
          packageTypes: ['BASIC'],
          instructorId: this.tokens.instructor ? 'instructor-id' : 'test-instructor-id'
        };
        
        const { response, data } = await this.makeRequest('/api/admin/courses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.tokens.admin}` },
          body: JSON.stringify(newCourse)
        });
        
        if (!response.ok) throw new Error(`Failed to create course: ${data.error}`);
        if (!data.success) throw new Error('Course creation response invalid');
      });
    }

    // Test 6: Payment Endpoints
    await this.test('Create Payment Order', async () => {
      if (!this.tokens.student) throw new Error('Student token required');
      
      // Get a course for payment
      const { data: coursesData } = await this.makeRequest('/api/courses');
      if (coursesData.data.length === 0) throw new Error('No courses available');
      
      const course = coursesData.data[0];
      const orderData = {
        courseId: course.id,
        amount: course.price
      };
      
      const { response, data } = await this.makeRequest('/api/payments/create-order', {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.tokens.student}` },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) throw new Error(`Failed to create payment order: ${data.error}`);
      if (!data.orderId) throw new Error('Order ID missing from response');
    });

    // Test 7: Withdrawal Endpoints
    if (this.tokens.student) {
      await this.test('Get Withdrawal Requests', async () => {
        const { response, data } = await this.makeRequest('/api/withdrawals', {
          headers: { Authorization: `Bearer ${this.tokens.student}` }
        });
        if (!response.ok) throw new Error(`Failed to fetch withdrawals: ${data.error}`);
        if (!Array.isArray(data.data)) throw new Error('Withdrawals data is not an array');
      });
    }

    // Test 8: Newsletter Subscription
    await this.test('Newsletter Subscription', async () => {
      const subscriptionData = {
        email: `newsletter${Date.now()}@example.com`
      };
      
      const { response, data } = await this.makeRequest('/api/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscriptionData)
      });
      
      if (!response.ok) throw new Error(`Failed to subscribe to newsletter: ${data.error}`);
      if (!data.success) throw new Error('Newsletter subscription response invalid');
    });

    // Print Results
    console.log('\n📊 TEST RESULTS');
    console.log('================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }

    console.log('\n🎉 ENDPOINT TESTING COMPLETED!');
    return this.results;
  }
}

// Run the tests
async function runTests() {
  const tester = new EndpointTester();
  
  // Wait a bit for server to be ready
  console.log('⏳ Waiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

runTests();