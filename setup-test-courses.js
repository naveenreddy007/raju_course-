const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Test courses data matching the Prisma schema
const testCourses = [
  {
    title: 'Complete Digital Marketing Mastery',
    description: 'Master digital marketing from basics to advanced strategies',
    shortDescription: 'Learn digital marketing fundamentals and advanced techniques',
    slug: 'digital-marketing-mastery',
    price: 2999.00,
    packageTypes: ['SILVER', 'GOLD', 'PLATINUM'],
    isActive: true,
    isPublished: true,
    duration: 180,
    modules: [
      {
        title: 'Introduction to Digital Marketing',
        description: 'Understanding the digital marketing landscape',
        order: 1,
        duration: 45
      },
      {
        title: 'SEO Fundamentals',
        description: 'Learn search engine optimization best practices',
        order: 2,
        duration: 45
      },
      {
        title: 'Social Media Marketing',
        description: 'Master social media platforms for business',
        order: 3,
        duration: 45
      }
    ]
  },
  {
    title: 'Advanced Web Development',
    description: 'Build modern web applications with React and Node.js',
    shortDescription: 'Full-stack web development course',
    slug: 'advanced-web-development',
    price: 4999.00,
    packageTypes: ['GOLD', 'PLATINUM'],
    isActive: true,
    isPublished: true,
    duration: 300,
    modules: [
      {
        title: 'React Fundamentals',
        description: 'Learn React from scratch',
        order: 1,
        duration: 60
      },
      {
        title: 'Node.js Backend Development',
        description: 'Build APIs with Node.js and Express',
        order: 2,
        duration: 90
      },
      {
        title: 'Database Integration',
        description: 'Connect your app to databases',
        order: 3,
        duration: 75
      },
      {
        title: 'Deployment and DevOps',
        description: 'Deploy your applications to production',
        order: 4,
        duration: 75
      }
    ]
  },
  {
    title: 'Business Growth Strategies',
    description: 'Scale your business with proven growth strategies',
    shortDescription: 'Learn business scaling and growth techniques',
    slug: 'business-growth-strategies',
    price: 1999.00,
    packageTypes: ['SILVER', 'GOLD', 'PLATINUM'],
    isActive: true,
    isPublished: true,
    duration: 120,
    modules: [
      {
        title: 'Market Analysis',
        description: 'Understand your market and competition',
        order: 1,
        duration: 40
      },
      {
        title: 'Customer Acquisition',
        description: 'Strategies to acquire new customers',
        order: 2,
        duration: 40
      },
      {
        title: 'Revenue Optimization',
        description: 'Maximize your revenue streams',
        order: 3,
        duration: 40
      }
    ]
  }
];

async function setupTestCourses() {
  try {
    console.log('Setting up test courses...');
    
    for (const courseData of testCourses) {
      const { modules, ...courseInfo } = courseData;
      
      // Check if course already exists
      const existingCourse = await prisma.course.findUnique({
        where: { slug: courseInfo.slug }
      });
      
      if (existingCourse) {
        console.log(`Course "${courseInfo.title}" already exists, skipping...`);
        continue;
      }
      
      // Create course with modules
      const course = await prisma.course.create({
        data: {
          ...courseInfo,
          modules: {
            create: modules
          }
        },
        include: {
          modules: true
        }
      });
      
      console.log(`✓ Created course: "${course.title}" with ${course.modules.length} modules`);
    }
    
    console.log('\n✅ Test courses setup completed!');
    
    // Display summary
    const totalCourses = await prisma.course.count();
    const totalModules = await prisma.courseModule.count();
    
    console.log(`\nDatabase Summary:`);
    console.log(`- Total Courses: ${totalCourses}`);
    console.log(`- Total Modules: ${totalModules}`);
    
  } catch (error) {
    console.error('Error setting up test courses:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanupTestCourses() {
  try {
    console.log('Cleaning up test courses...');
    
    // Delete all course modules first (due to foreign key constraints)
    await prisma.courseModule.deleteMany({});
    console.log('✓ Deleted all course modules');
    
    // Delete all courses
    await prisma.course.deleteMany({});
    console.log('✓ Deleted all courses');
    
    console.log('\n✅ Test courses cleanup completed!');
    
  } catch (error) {
    console.error('Error cleaning up test courses:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'setup') {
    setupTestCourses().catch(console.error);
  } else if (command === 'cleanup') {
    cleanupTestCourses().catch(console.error);
  } else {
    console.log('Usage:');
    console.log('  bun run setup-test-courses.js setup   - Create test courses');
    console.log('  bun run setup-test-courses.js cleanup - Remove test courses');
  }
}

module.exports = {
  setupTestCourses,
  cleanupTestCourses
};