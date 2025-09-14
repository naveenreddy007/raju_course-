# Endpoint Testing Plan

This document provides a comprehensive plan to test all API endpoints and verify access to both client and admin dashboards after implementing the local Supabase instance.

## Overview

After implementing the local Supabase instance, it's crucial to test all API endpoints and verify that both client and admin dashboards are accessible and functioning correctly. This testing plan will ensure that the application works as expected with the local Supabase configuration.

## Prerequisites

Before running the tests, ensure that:

1. The local Supabase instance is running: `docker-compose -f docker-compose.local.yml up -d`
2. The development server is running: `bun run dev`
3. All environment variables are properly configured in `.env` and `.env.local`

## API Endpoint Testing

### Authentication Endpoints

#### 1. POST /api/auth/login
**Purpose**: Authenticate a user and return a session token
**Test Data**:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "email": "test@example.com",
      "name": "Test User",
      "role": "USER"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token"
    }
  }
}
```
**Testing Script**:
```javascript
// test-auth-login.js
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
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
```

#### 2. POST /api/auth/register
**Purpose**: Register a new user
**Test Data**:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User",
  "phone": "1234567890"
}
```
**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "new-user-id",
      "email": "newuser@example.com",
      "name": "New User",
      "phone": "1234567890",
      "role": "USER",
      "isActive": true,
      "kycStatus": "PENDING"
    },
    "session": {
      "access_token": "jwt-token",
      "refresh_token": "refresh-token"
    }
  }
}
```
**Testing Script**:
```javascript
// test-auth-register.js
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
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
```

### Dashboard Endpoints

#### 3. GET /api/dashboard/stats
**Purpose**: Get dashboard statistics for a user
**Headers**: Authorization: Bearer {jwt-token}
**Expected Response**:
```json
{
  "success": true,
  "data": {
    "totalEarnings": 1000,
    "totalReferrals": 5,
    "totalCourses": 3,
    "recentActivity": []
  }
}
```
**Testing Script**:
```javascript
// test-dashboard-stats.js
const http = require('http');

// Replace with a valid JWT token obtained from login
const jwtToken = 'your-jwt-token';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/dashboard/stats',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
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
  console.error(`Problem with request: ${e.message}`);
});

req.end();
```

### Course Endpoints

#### 4. GET /api/courses
**Purpose**: Get all available courses
**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "course-id-1",
      "title": "Course 1",
      "description": "Description for Course 1",
      "price": 99.99,
      "imageUrl": "https://example.com/course1.jpg"
    },
    {
      "id": "course-id-2",
      "title": "Course 2",
      "description": "Description for Course 2",
      "price": 149.99,
      "imageUrl": "https://example.com/course2.jpg"
    }
  ]
}
```
**Testing Script**:
```javascript
// test-courses.js
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
  console.error(`Problem with request: ${e.message}`);
});

req.end();
```

### Blog Endpoints

#### 5. GET /api/blog
**Purpose**: Get all blog posts
**Expected Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "blog-post-id-1",
      "title": "Blog Post 1",
      "excerpt": "Excerpt for Blog Post 1",
      "content": "Full content for Blog Post 1",
      "publishedAt": "2023-01-01T00:00:00.000Z",
      "author": {
        "id": "author-id-1",
        "name": "Author Name",
        "email": "author@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 1,
    "totalPages": 1
  }
}
```
**Testing Script**:
```javascript
// test-blog.js
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
  console.error(`Problem with request: ${e.message}`);
});

req.end();
```

### Admin Endpoints

#### 6. POST /api/admin/login
**Purpose**: Authenticate an admin user
**Test Data**:
```json
{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```
**Expected Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "admin-id",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "session": {
      "access_token": "admin-jwt-token",
      "refresh_token": "admin-refresh-token"
    }
  }
}
```
**Testing Script**:
```javascript
// test-admin-login.js
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
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
```

#### 7. GET /api/admin/stats
**Purpose**: Get admin dashboard statistics
**Headers**: Authorization: Bearer {admin-jwt-token}
**Expected Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "totalCourses": 10,
    "totalEarnings": 10000,
    "recentRegistrations": []
  }
}
```
**Testing Script**:
```javascript
// test-admin-stats.js
const http = require('http');

// Replace with a valid admin JWT token obtained from admin login
const jwtToken = 'your-admin-jwt-token';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/stats',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
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
  console.error(`Problem with request: ${e.message}`);
});

req.end();
```

## Dashboard Access Testing

### Client Dashboard

#### Testing Client Dashboard Access
1. Navigate to `http://localhost:3000/auth/login`
2. Log in with a user account
3. Verify that you are redirected to the client dashboard at `http://localhost:3000/dashboard`
4. Check that all dashboard components are displayed correctly
5. Test navigation between different dashboard sections (courses, earnings, referrals, etc.)

### Admin Dashboard

#### Testing Admin Dashboard Access
1. Navigate to `http://localhost:3000/admin/login`
2. Log in with an admin account
3. Verify that you are redirected to the admin dashboard at `http://localhost:3000/admin`
4. Check that all admin dashboard components are displayed correctly
5. Test navigation between different admin sections (users, courses, stats, etc.)

## Comprehensive Testing Script

Create a comprehensive testing script that runs all endpoint tests:

```javascript
// test-all-endpoints.js
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
  
  // Create other test scripts similarly...
  // (Implementation omitted for brevity)
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
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  }
}

// Run all tests
runAllTests();
```

## Test Execution

1. Save the comprehensive testing script as `test-all-endpoints.js`
2. Run the script: `node test-all-endpoints.js`
3. Review the output to ensure all tests pass
4. Manually test the client and admin dashboards as described above

## Expected Results

All tests should pass with the following results:

1. Authentication endpoints should successfully register and authenticate users
2. Dashboard endpoints should return the expected data structure
3. Course and blog endpoints should return the expected lists of items
4. Admin endpoints should only be accessible to admin users
5. Both client and admin dashboards should be accessible and display the expected content

## Troubleshooting

If any tests fail:

1. Check that the local Supabase instance is running: `docker-compose -f docker-compose.local.yml ps`
2. Verify that the development server is running: `bun run dev`
3. Check the environment variables in `.env` and `.env.local`
4. Review the server logs for any error messages
5. Ensure the database schema matches the expected structure

By following this testing plan, you can verify that all endpoints are working correctly and that both client and admin dashboards are accessible with the local Supabase configuration.