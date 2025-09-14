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
    try {
      console.log('Response:', JSON.parse(data));
    } catch (e) {
      console.log('Raw Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();