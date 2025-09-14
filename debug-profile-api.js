import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugProfileAPI() {
  console.log('=== Debugging User Profile API ===\n');

  try {
    // Step 1: Login to get token
    console.log('--- Step 1: Getting authentication token ---');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    const userId = loginData.user.id;
    console.log('✅ Login successful');
    console.log('User ID:', userId);
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');

    // Step 2: Check user data directly in database
    console.log('\n--- Step 2: Checking user data in database ---');
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        affiliate: {
          select: {
            referralCode: true,
            totalDirectEarnings: true,
            totalIndirectEarnings: true,
            currentBalance: true
          }
        },
        bankDetails: {
          select: {
            id: true,
            bankName: true,
            accountNumber: true,
            accountHolderName: true,
            ifscCode: true,
            isVerified: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            referrals: true
          }
        }
      }
    });

    if (dbUser) {
      console.log('✅ User found in database');
      console.log('User details:');
      console.log('  ID:', dbUser.id);
      console.log('  Email:', dbUser.email);
      console.log('  Name:', dbUser.name);
      console.log('  Role:', dbUser.role);
      console.log('  Active:', dbUser.isActive);
      console.log('  Affiliate:', dbUser.affiliate ? 'Yes' : 'No');
      console.log('  Bank Details:', dbUser.bankDetails ? dbUser.bankDetails.length : 0);
      console.log('  Enrollments Count:', dbUser._count.enrollments);
      console.log('  Referrals Count:', dbUser._count.referrals);
    } else {
      console.log('❌ User not found in database');
    }

    // Step 3: Test profile API with detailed error logging
    console.log('\n--- Step 3: Testing User Profile API ---');
    const profileResponse = await fetch('http://localhost:3000/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Profile API Status:', profileResponse.status);
    console.log('Profile API Headers:', Object.fromEntries(profileResponse.headers.entries()));
    
    const profileText = await profileResponse.text();
    console.log('Profile API Raw Response:', profileText);

    try {
      const profileData = JSON.parse(profileText);
      console.log('Profile API Parsed Response:', JSON.stringify(profileData, null, 2));
    } catch (parseError) {
      console.log('Failed to parse profile response as JSON');
    }

    // Step 4: Test profile update API
    console.log('\n--- Step 4: Testing User Profile Update API ---');
    const updateResponse = await fetch('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test User Debug',
        phone: '+1234567890'
      })
    });

    console.log('Update API Status:', updateResponse.status);
    const updateText = await updateResponse.text();
    console.log('Update API Raw Response:', updateText);

    try {
      const updateData = JSON.parse(updateText);
      console.log('Update API Parsed Response:', JSON.stringify(updateData, null, 2));
    } catch (parseError) {
      console.log('Failed to parse update response as JSON');
    }

  } catch (error) {
    console.error('Debug script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProfileAPI();