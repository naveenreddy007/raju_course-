// Verify existing users in the system

const BASE_URL = 'http://localhost:3000'

// Test different user credentials that might exist
const potentialUsers = [
  { email: 'test@example.com', password: 'password123' },
  { email: 'admin@example.com', password: 'admin123' },
  { email: 'user@example.com', password: 'password123' },
  { email: 'demo@example.com', password: 'demo123' }
]

async function testLogin(email, password) {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    return {
      email,
      status: response.status,
      success: response.ok,
      message: data.message || data.error || 'No message',
      hasToken: !!data.token
    }
  } catch (error) {
    return {
      email,
      status: 'ERROR',
      success: false,
      message: error.message,
      hasToken: false
    }
  }
}

async function verifyUsers() {
  console.log('=== VERIFYING EXISTING USERS ===')
  
  for (const user of potentialUsers) {
    const result = await testLogin(user.email, user.password)
    console.log(`${result.success ? '✅' : '❌'} ${user.email}:`, {
      status: result.status,
      success: result.success,
      message: result.message,
      hasToken: result.hasToken
    })
  }
  
  console.log('\n=== USER VERIFICATION COMPLETED ===')
}

verifyUsers().catch(console.error)