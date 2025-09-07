// Test Signup Functionality
const fs = require('fs')
const path = require('path')

// Read .env.local file manually
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found')
    process.exit(1)
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n')
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=')
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        process.env[key] = value
      }
    }
  }
}

loadEnvFile()

async function testSignupAPI() {
  console.log('🔍 Testing Signup API Functionality...')
  console.log('=====================================')
  
  const testUser = {
    supabaseId: 'test_' + Date.now(),
    email: `test${Date.now()}@example.com`,
    name: 'Test User',
    phone: '9876543210',
    packageType: 'SILVER',
    referralCode: ''
  }
  
  try {
    console.log('📝 Test user data:')
    console.log(JSON.stringify(testUser, null, 2))
    
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    })
    
    console.log(`\n📡 Response status: ${response.status}`)
    
    const responseData = await response.text()
    console.log('📄 Response data:')
    console.log(responseData)
    
    if (!response.ok) {
      console.log('\n❌ Signup API test failed')
      console.log('This indicates an issue with the registration API')
    } else {
      console.log('\n✅ Signup API test passed')
      console.log('The registration API is working correctly')
    }
    
  } catch (error) {
    console.error('\n❌ Error testing signup API:', error.message)
    console.log('This could indicate:')
    console.log('1. Server is not running on port 3000')
    console.log('2. Database connection issues')
    console.log('3. Prisma client not initialized')
  }
}

// Test after a short delay to ensure server is ready
setTimeout(() => {
  testSignupAPI()
}, 3000)