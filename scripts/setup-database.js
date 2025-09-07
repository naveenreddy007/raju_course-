const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Read .env.local file and set environment variables
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

async function setupDatabase() {
  console.log('🔧 Setting up Supabase Database Tables...')
  console.log('==========================================')
  
  // Load environment variables
  loadEnvFile()
  
  console.log('📋 Checking Database Connection...')
  
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables')
    console.log('Please check your .env.local file and ensure DATABASE_URL is set')
    process.exit(1)
  }
  
  const dbUrl = process.env.DATABASE_URL
  console.log('Database URL found:', dbUrl.substring(0, 50) + '...')
  
  // Check if it contains placeholder
  if (dbUrl.includes('[YOUR-PASSWORD]') || dbUrl.includes('temp123')) {
    console.log('')
    console.log('⚠️  ATTENTION: Database password needs to be updated!')
    console.log('==========================================')
    console.log('Your DATABASE_URL contains a placeholder password.')
    console.log('')
    console.log('To get your actual database password:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project: hqiwlspjsrgqnygnrvuj')
    console.log('3. Navigate to Settings → Database')
    console.log('4. Find "Connection string" or reset your database password')
    console.log('5. Update the DATABASE_URL in your .env.local file')
    console.log('')
    console.log('Current DATABASE_URL format should be:')
    console.log('postgresql://postgres.hqiwlspjsrgqnygnrvuj:YOUR_ACTUAL_PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true')
    console.log('')
    
    // Try to proceed anyway to show the error
    console.log('Attempting to connect with current credentials...')
  }
  
  try {
    console.log('🚀 Running database push...')
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      env: { ...process.env }
    })
    
    console.log('')
    console.log('🎉 Database setup completed successfully!')
    console.log('✅ All tables have been created in your Supabase database')
    
  } catch (error) {
    console.log('')
    console.log('❌ Database setup failed')
    console.log('This is likely because the database password is incorrect.')
    console.log('')
    console.log('Next steps:')
    console.log('1. Get your actual database password from Supabase dashboard')
    console.log('2. Update the DATABASE_URL in .env.local file')
    console.log('3. Run this script again: node scripts/setup-database.js')
    console.log('')
    process.exit(1)
  }
}

setupDatabase()