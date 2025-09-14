// Test Data Setup Script
// Creates test users for authentication and other tests

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const prisma = new PrismaClient();

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test users configuration
const TEST_USERS = [
  {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User 1',
    phone: '+919876543210',
    role: 'USER'
  },
  {
    email: 'test2@example.com',
    password: 'testpassword123',
    name: 'Test User 2',
    phone: '+919876543211',
    role: 'USER'
  },
  {
    email: 'test3@example.com',
    password: 'testpassword123',
    name: 'Test User 3',
    phone: '+919876543212',
    role: 'USER'
  },
  {
    email: 'test4@example.com',
    password: 'testpassword123',
    name: 'Test User 4',
    phone: '+919876543213',
    role: 'USER'
  },
  {
    email: 'admin@example.com',
    password: 'adminpassword123',
    name: 'Admin User',
    phone: '+919876543214',
    role: 'ADMIN'
  }
];

async function createTestUser(userData) {
  try {
    console.log(`Creating test user: ${userData.email}`);
    
    // Check if user already exists in Supabase
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === userData.email);
    
    let supabaseUser;
    if (existingUser) {
      console.log(`  Supabase user already exists: ${userData.email}`);
      supabaseUser = existingUser;
    } else {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          phone: userData.phone
        }
      });
      
      if (authError) {
        console.error(`  Error creating Supabase user: ${authError.message}`);
        return false;
      }
      
      supabaseUser = authData.user;
      console.log(`  Created Supabase user: ${userData.email}`);
    }
    
    // Check if user exists in our database
    const existingDbUser = await prisma.user.findUnique({
      where: { email: userData.email.toLowerCase() }
    });
    
    if (existingDbUser) {
      console.log(`  Database user already exists: ${userData.email}`);
      return true;
    }
    
    // Create user in our database
    const user = await prisma.user.create({
      data: {
        email: userData.email.toLowerCase(),
        name: userData.name,
        phone: userData.phone,
        supabaseId: supabaseUser.id,
        role: userData.role,
        emailVerified: true,
        phoneVerified: false,
        isActive: true,
        lastLoginAt: new Date()
      }
    });
    
    // Create affiliate record
    const userReferralCode = `USER${user.id.slice(-6).toUpperCase()}`;
    await prisma.affiliate.create({
      data: {
        userId: user.id,
        referralCode: userReferralCode,
        commissionRate: 0.10,
        totalDirectEarnings: Math.floor(Math.random() * 10000), // Random earnings for testing
        totalIndirectEarnings: Math.floor(Math.random() * 5000),
        totalWithdrawn: 0,
        currentBalance: Math.floor(Math.random() * 3000),
        packageType: 'SILVER',
        packagePrice: 0,
        purchaseDate: new Date(),
        isActive: true
      }
    });
    
    console.log(`  ✓ Created database user and affiliate: ${userData.email}`);
    return true;
    
  } catch (error) {
    console.error(`  Error creating user ${userData.email}:`, error.message);
    return false;
  }
}

async function setupTestData() {
  console.log('Setting up test data...');
  console.log('=' .repeat(50));
  
  let successCount = 0;
  
  for (const userData of TEST_USERS) {
    const success = await createTestUser(userData);
    if (success) successCount++;
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`Test data setup complete: ${successCount}/${TEST_USERS.length} users created`);
  
  // Create some sample referral relationships
  try {
    console.log('\nSetting up referral relationships...');
    
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: TEST_USERS.map(u => u.email)
        }
      },
      include: {
        affiliate: true
      }
    });
    
    if (users.length >= 4) {
      // Make user 2 referred by user 1
      const user1 = users.find(u => u.email === 'test@example.com');
      const user2 = users.find(u => u.email === 'test2@example.com');
      
      if (user1 && user2) {
        await prisma.affiliate.update({
          where: { userId: user2.id },
          data: { parentId: user1.id }
        });
        
        await prisma.referral.create({
          data: {
            affiliateId: user1.affiliate.id,
            referredUserId: user2.id
          }
        });
        
        console.log('  ✓ Set up referral: User 2 referred by User 1');
      }
      
      // Make user 3 referred by user 2
      const user3 = users.find(u => u.email === 'test3@example.com');
      
      if (user2 && user3) {
        await prisma.affiliate.update({
          where: { userId: user3.id },
          data: { parentId: user2.id }
        });
        
        await prisma.referral.create({
          data: {
            affiliateId: user2.affiliate.id,
            referredUserId: user3.id
          }
        });
        
        console.log('  ✓ Set up referral: User 3 referred by User 2');
      }
    }
    
  } catch (error) {
    console.error('Error setting up referral relationships:', error.message);
  }
  
  console.log('\nTest data setup completed!');
  console.log('\nTest Users Created:');
  TEST_USERS.forEach(user => {
    console.log(`  - ${user.email} (${user.name}) - Role: ${user.role}`);
  });
}

async function cleanupTestData() {
  console.log('Cleaning up test data...');
  
  try {
    // Delete from our database
    const testEmails = TEST_USERS.map(u => u.email.toLowerCase());
    
    // Delete referrals first
    await prisma.referral.deleteMany({
      where: {
        OR: [
          {
            affiliate: {
              user: {
                email: { in: testEmails }
              }
            }
          },
          {
            referredUser: {
              email: { in: testEmails }
            }
          }
        ]
      }
    });
    
    // Delete affiliates
    await prisma.affiliate.deleteMany({
      where: {
        user: {
          email: { in: testEmails }
        }
      }
    });
    
    // Delete users
    await prisma.user.deleteMany({
      where: {
        email: { in: testEmails }
      }
    });
    
    console.log('✓ Cleaned up database records');
    
    // Clean up Supabase users
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    for (const email of testEmails) {
      const supabaseUser = existingUsers.users.find(u => u.email === email);
      if (supabaseUser) {
        await supabase.auth.admin.deleteUser(supabaseUser.id);
        console.log(`✓ Deleted Supabase user: ${email}`);
      }
    }
    
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
}

// Command line interface
const command = process.argv[2];

if (command === 'setup') {
  setupTestData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
} else if (command === 'cleanup') {
  cleanupTestData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
} else {
  console.log('Usage:');
  console.log('  bun run setup-test-data.js setup   - Create test users');
  console.log('  bun run setup-test-data.js cleanup - Remove test users');
}

module.exports = { setupTestData, cleanupTestData };