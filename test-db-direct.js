require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Use direct URL for testing
process.env.DATABASE_URL = process.env.DIRECT_URL;
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database with direct connection...');
    
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