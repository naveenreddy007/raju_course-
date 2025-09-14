import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugDashboardAPI() {
  console.log('=== Debugging Dashboard API Issues ===\n');

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

    // Step 2: Check user's enrollments directly in database
    console.log('\n--- Step 2: Checking user enrollments in database ---');
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId,
        status: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            _count: {
              select: {
                modules: true
              }
            }
          }
        },
        transaction: {
          select: {
            amount: true,
            createdAt: true
          }
        }
      }
    });

    console.log('Found enrollments:', enrollments.length);
    enrollments.forEach((enrollment, index) => {
      console.log(`Enrollment ${index + 1}:`);
      console.log('  Course ID:', enrollment.courseId);
      console.log('  Course Title:', enrollment.course?.title || 'N/A');
      console.log('  Status:', enrollment.status);
      console.log('  Modules Count:', enrollment.course?._count?.modules || 0);
    });

    // Step 3: Test dashboard API with detailed error logging
    console.log('\n--- Step 3: Testing Dashboard Courses API ---');
    const dashboardResponse = await fetch('http://localhost:3000/api/dashboard/courses', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Dashboard API Status:', dashboardResponse.status);
    console.log('Dashboard API Headers:', Object.fromEntries(dashboardResponse.headers.entries()));
    
    const dashboardText = await dashboardResponse.text();
    console.log('Dashboard API Raw Response:', dashboardText);

    try {
      const dashboardData = JSON.parse(dashboardText);
      console.log('Dashboard API Parsed Response:', JSON.stringify(dashboardData, null, 2));
    } catch (parseError) {
      console.log('Failed to parse dashboard response as JSON');
    }

    // Step 4: Test user progress queries
    if (enrollments.length > 0) {
      console.log('\n--- Step 4: Testing user progress queries ---');
      const firstEnrollment = enrollments[0];
      
      try {
        const completedModules = await prisma.userProgress.count({
          where: {
            userId,
            module: {
              courseId: firstEnrollment.courseId
            },
            completed: true
          }
        });
        console.log('Completed modules count:', completedModules);
      } catch (progressError) {
        console.log('Error querying user progress:', progressError.message);
      }
    }

    // Step 5: Test auth/user API with correct method
    console.log('\n--- Step 5: Testing User Profile API (POST method) ---');
    const userResponse = await fetch('http://localhost:3000/api/auth/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        supabaseId: loginData.user.supabaseId
      })
    });

    console.log('User API Status:', userResponse.status);
    const userData = await userResponse.json();
    console.log('User API Response:', JSON.stringify(userData, null, 2));

  } catch (error) {
    console.error('Debug script error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDashboardAPI();