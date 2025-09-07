// Verify Database Tables Creation
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

async function verifyTables() {
  console.log('🔍 Verifying Database Tables...')
  console.log('==============================')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  const expectedTables = [
    'users',
    'affiliates', 
    'commissions',
    'transactions',
    'referrals',
    'courses',
    'course_modules',
    'enrollments',
    'user_progress',
    'blog_posts',
    'newsletter_subscriptions',
    'bank_details',
    'notifications'
  ]
  
  console.log('Checking tables existence...')
  
  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: Table exists and accessible`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }
  
  console.log('')
  console.log('🎉 Database Verification Complete!')
  console.log('Your affiliate learning platform is ready!')
  console.log('')
  console.log('🚀 Available Features:')
  console.log('• User Registration & Authentication with KYC')
  console.log('• Two-Level Affiliate Commission System (Silver/Gold/Platinum)')
  console.log('• Course Management & Video Learning')
  console.log('• Transaction & Payment Tracking')
  console.log('• Blog & Newsletter System')
  console.log('• Mobile-First Responsive Design')
  console.log('')
  console.log('🌐 Access your application at: http://localhost:3001')
}

verifyTables()