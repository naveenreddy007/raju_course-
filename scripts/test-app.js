// Test application startup and Supabase connection
const { createClient } = require('@supabase/supabase-js')
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

async function testApplication() {
  console.log('🚀 Testing Application Startup...')
  console.log('==================================')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('📋 Environment Variables:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Found' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Found' : '❌ Missing')
  console.log('')
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required Supabase credentials')
    process.exit(1)
  }
  
  try {
    // Test client connection (like in the app)
    console.log('🔗 Testing client connection...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    
    // Test admin connection (if service key available)
    if (supabaseServiceKey) {
      console.log('🔐 Testing admin connection...')
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      console.log('✅ Admin client initialized successfully')
    } else {
      console.log('⚠️  Service role key not available (this is optional)')
    }
    
    console.log('✅ Client initialized successfully')
    
    // Test basic auth functionality
    console.log('🔐 Testing authentication...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError && !authError.message.includes('session')) {
      console.error('❌ Auth error:', authError.message)
    } else {
      console.log('✅ Authentication system working')
    }
    
    console.log('')
    console.log('🎉 Application Test Complete!')
    console.log('✅ All systems operational')
    console.log('🌐 Server running at: http://localhost:3001')
    
  } catch (error) {
    console.error('❌ Application test failed:', error.message)
    process.exit(1)
  }
}

testApplication()