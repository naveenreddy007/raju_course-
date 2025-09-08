const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log('🔍 Verifying database connection and schema...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Check if we can run raw queries
    const result = await prisma.$queryRaw`SELECT current_database(), current_schema()`;
    console.log('✅ Database info:', result);
    
    // List all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log('📋 Available tables:', tables);
    
    // Try to access users table specifically
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Users table accessible: ${userCount} records`);
    } catch (error) {
      console.log('❌ Users table not accessible:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();