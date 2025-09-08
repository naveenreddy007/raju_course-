const http = require('http');

console.log('='.repeat(60));
console.log('API ENDPOINTS TEST');
console.log('='.repeat(60));

const baseUrl = 'http://localhost:3000/api';
const endpoints = [
  '/auth/login',
  '/auth/register',
  '/dashboard/stats',
  '/courses',
  '/blog'
];

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const req = http.request(url, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = { raw: data };
        }
        
        resolve({
          url: url,
          status: res.statusCode,
          statusText: res.statusMessage,
          success: res.statusCode >= 200 && res.statusCode < 400,
          data: parsedData
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url: url,
        status: 'ERROR',
        statusText: error.message,
        success: false,
        data: { error: error.message }
      });
    });
    
    req.setTimeout(5000);
    req.end();
  });
}

async function runTests() {
  console.log('\nTesting API endpoints...\n');
  
  const results = [];
  
  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint}... `);
    const result = await testEndpoint(baseUrl + endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.status} ${result.statusText}`);
      
      // Show a snippet of the response
      if (result.data && typeof result.data === 'object') {
        if (result.data.error) {
          console.log(`   Error: ${result.data.error}`);
        } else if (result.data.message) {
          console.log(`   Message: ${result.data.message}`);
        } else if (result.data.data) {
          console.log(`   Response contains data`);
        }
      }
    } else {
      console.log(`❌ ${result.status} ${result.statusText}`);
      if (result.data && result.data.error) {
        console.log(`   Error: ${result.data.error}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\nFailed endpoints:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.url}: ${r.status} ${r.statusText}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

runTests();