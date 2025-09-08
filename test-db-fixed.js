// Set the direct URL before loading dotenv
process.env.DATABASE_URL = "postgresql://postgres.yrpcgkrichksljfrtmvs:rmrnn0077@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database with direct connection...');
    console.log('Using URL:', process.env.DATABASE_URL.substring(0, 50) + '...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Test user table
    const userCount = await prisma.user.count();
    console.log(`✅ Users table accessible, count: ${userCount}`);
    
    // Test other key tables
    const affiliateCount = await prisma.affiliate.count();
    console.log(`✅ Affiliates table accessible, count: ${affiliateCount}`);
    
    const courseCount = await prisma.course.count();
    console.log(`✅ Courses table accessible, count: ${courseCount}`);
    
    console.log('✅ Database schema is working correctly!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();