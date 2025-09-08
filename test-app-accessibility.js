const http = require('http');

console.log('='.repeat(60));
console.log('APPLICATION ACCESSIBILITY TEST');
console.log('='.repeat(60));

const baseUrl = 'http://localhost:3000';
const pages = [
  '/',
  '/auth/login',
  '/auth/register',
  '/dashboard',
  '/courses',
  '/about',
  '/contact',
  '/blog'
];

async function testPage(url) {
  return new Promise((resolve) => {
    const req = http.request(url, { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          url: url,
          status: res.statusCode,
          statusText: res.statusMessage,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url: url,
        status: 'ERROR',
        statusText: error.message,
        success: false
      });
    });
    
    req.setTimeout(5000);
    req.end();
  });
}

async function runTests() {
  console.log('\nTesting page accessibility...\n');
  
  const results = [];
  
  for (const page of pages) {
    process.stdout.write(`Testing ${page}... `);
    const result = await testPage(baseUrl + page);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.status} ${result.statusText}`);
    } else {
      console.log(`❌ ${result.status} ${result.statusText}`);
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
    console.log('\nFailed pages:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.url}: ${r.status} ${r.statusText}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

runTests();