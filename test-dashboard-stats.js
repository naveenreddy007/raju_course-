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