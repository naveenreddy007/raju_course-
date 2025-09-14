const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserData() {
  try {
    console.log('=== Checking User Data ===\n');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        supabaseId: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Supabase ID: ${user.supabaseId}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    // Check if we have any test users
    const testUsers = users.filter(user => 
      user.email.includes('test') || 
      user.email.includes('demo') ||
      user.email.includes('admin')
    );

    if (testUsers.length > 0) {
      console.log('Test users found:');
      testUsers.forEach(user => {
        console.log(`- ${user.email} (${user.id})`);
      });
    } else {
      console.log('No obvious test users found.');
      console.log('\nSuggestion: Create a test user or check the seeding script.');
    }

  } catch (error) {
    console.error('Error checking user data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();