const { exec } = require('child_process');
const fs = require('fs');

// List of test scripts to run
const testScripts = [
  'test-auth-register.js',
  'test-auth-login.js',
  'test-dashboard-stats.js',
  'test-courses.js',
  'test-blog.js',
  'test-admin-login.js',
  'test-admin-stats.js'
];

// Function to run a test script
function runTest(script) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== Running ${script} ===`);
    
    exec(`node ${script}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        return reject(new Error(stderr));
      }
      
      console.log(`Output: ${stdout}`);
      resolve();
    });
  });
}

// Function to create test scripts if they don't exist
function createTestScripts() {
  // Create test-auth-register.js
  if (!fs.existsSync('test-auth-register.js')) {
    fs.writeFileSync('test-auth-register.js', `
const http = require('http');

const postData = JSON.stringify({
  email: 'newuser@example.com',
  password: 'password123',
  name: 'New User',
  phone: '1234567890'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(\`Problem with request: \${e.message}\`);
});

req.write(postData);
req.end();
    `);
  }
  
  // Create test-auth-login.js
  if (!fs.existsSync('test-auth-login.js')) {
    fs.writeFileSync('test-auth-login.js', `
const http = require('http');

const postData = JSON.stringify({
  email: 'test@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(\`Problem with request: \${e.message}\`);
});

req.write(postData);
req.end();
    `);
  }
  
  // Create test-dashboard-stats.js
  if (!fs.existsSync('test-dashboard-stats.js')) {
    fs.writeFileSync('test-dashboard-stats.js', `
const http = require('http');

// Replace with a valid JWT token obtained from login
const jwtToken = 'your-jwt-token';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/dashboard/stats',
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${jwtToken}\`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(\`Problem with request: \${e.message}\`);
});

req.end();
    `);
  }
  
  // Create test-courses.js
  if (!fs.existsSync('test-courses.js')) {
    fs.writeFileSync('test-courses.js', `
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/courses',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(\`Problem with request: \${e.message}\`);
});

req.end();
    `);
  }
  
  // Create test-blog.js
  if (!fs.existsSync('test-blog.js')) {
    fs.writeFileSync('test-blog.js', `
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/blog?page=1&limit=10',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(\`Problem with request: \${e.message}\`);
});

req.end();
    `);
  }
  
  // Create test-admin-login.js
  if (!fs.existsSync('test-admin-login.js')) {
    fs.writeFileSync('test-admin-login.js', `
const http = require('http');

const postData = JSON.stringify({
  email: 'admin@example.com',
  password: 'adminpassword'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(\`Problem with request: \${e.message}\`);
});

req.write(postData);
req.end();
    `);
  }
  
  // Create test-admin-stats.js
  if (!fs.existsSync('test-admin-stats.js')) {
    fs.writeFileSync('test-admin-stats.js', `
const http = require('http');

// Replace with a valid admin JWT token obtained from admin login
const jwtToken = 'your-admin-jwt-token';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/stats',
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${jwtToken}\`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (e) => {
  console.error(\`Problem with request: \${e.message}\`);
});

req.end();
    `);
  }
}

// Main function to run all tests
async function runAllTests() {
  try {
    console.log('=== Starting Endpoint Tests ===');
    
    // Create test scripts if they don't exist
    createTestScripts();
    
    // Run all test scripts
    for (const script of testScripts) {
      await runTest(script);
    }
    
    console.log('\n=== All Tests Completed ===');
    console.log('\n=== Manual Testing Instructions ===');
    console.log('1. Navigate to http://localhost:3000/auth/login');
    console.log('2. Log in with a user account');
    console.log('3. Verify that you are redirected to the client dashboard at http://localhost:3000/dashboard');
    console.log('4. Check that all dashboard components are displayed correctly');
    console.log('5. Test navigation between different dashboard sections (courses, earnings, referrals, etc.)');
    console.log('\n=== Admin Dashboard Testing ===');
    console.log('1. Navigate to http://localhost:3000/admin/login');
    console.log('2. Log in with an admin account');
    console.log('3. Verify that you are redirected to the admin dashboard at http://localhost:3000/admin');
    console.log('4. Check that all admin dashboard components are displayed correctly');
    console.log('5. Test navigation between different admin sections (users, courses, stats, etc.)');
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run all tests
runAllTests();