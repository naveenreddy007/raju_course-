// Test Supabase Cloud Connection
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

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Cloud Connection...')
  console.log('=======================================')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Found' : '❌ Missing')
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Found' : '❌ Missing')
    process.exit(1)
  }
  
  console.log('📋 Configuration:')
  console.log('URL:', supabaseUrl)
  console.log('Key:', supabaseKey.substring(0, 20) + '...')
  console.log('')
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    console.log('🔗 Testing basic connection...')
    const { data, error } = await supabase.from('users').select('count').limit(1)
    
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('Could not find the table')) {
        console.log('⚠️  Table "users" does not exist yet (expected for new database)')
        console.log('✅ Connection successful - database is accessible')
      } else {
        console.error('❌ Connection error:', error.message)
        process.exit(1)
      }
    } else {
      console.log('✅ Connection successful - database is accessible')
    }
    
    // Test authentication
    console.log('🔐 Testing authentication...')
    const { data: user, error: authError } = await supabase.auth.getUser()
    
    if (authError && authError.message !== 'Auth session missing!') {
      console.error('❌ Auth error:', authError.message)
    } else {
      console.log('✅ Authentication system is working')
    }
    
    console.log('')
    console.log('🎉 Supabase Cloud Connection Test Complete!')
    console.log('✅ Ready to proceed with database setup')
    console.log('')
    console.log('Next steps:')
    console.log('1. Run: bun run db:push (to create database tables)')
    console.log('2. Start development server: bun run dev')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    process.exit(1)
  }
}

testSupabaseConnection()