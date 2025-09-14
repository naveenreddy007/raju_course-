const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupBlogAndCourseData() {
  try {
    console.log('Setting up blog and course test data...');
    
    // Get test user for author
    const testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });
    
    if (!testUser) {
      console.log('Test user not found. Please run setup-test-data.js first.');
      return;
    }
    
    console.log('Found test user:', testUser.email);
    
    // Create sample blog posts
    const blogPosts = [
      {
        title: 'Getting Started with Web Development',
        slug: 'getting-started-web-development',
        content: 'This is a comprehensive guide to getting started with web development. Learn HTML, CSS, and JavaScript basics.',
        excerpt: 'Learn the fundamentals of web development with this beginner-friendly guide.',
        authorId: testUser.id,
        isPublished: true,
        publishedAt: new Date(),
        metaTitle: 'Web Development Guide',
        metaDescription: 'Complete guide to web development for beginners'
      },
      {
        title: 'Advanced JavaScript Techniques',
        slug: 'advanced-javascript-techniques',
        content: 'Explore advanced JavaScript concepts including closures, promises, async/await, and more.',
        excerpt: 'Master advanced JavaScript concepts and techniques.',
        authorId: testUser.id,
        isPublished: true,
        publishedAt: new Date(),
        metaTitle: 'Advanced JavaScript',
        metaDescription: 'Learn advanced JavaScript programming techniques'
      },
      {
        title: 'React Best Practices',
        slug: 'react-best-practices',
        content: 'Learn the best practices for building React applications including component design, state management, and performance optimization.',
        excerpt: 'Essential React best practices for modern development.',
        authorId: testUser.id,
        isPublished: true,
        publishedAt: new Date(),
        metaTitle: 'React Best Practices',
        metaDescription: 'Best practices for React development'
      }
    ];
    
    // Create blog posts
    for (const post of blogPosts) {
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug: post.slug }
      });
      
      if (!existingPost) {
        await prisma.blogPost.create({ data: post });
        console.log(`Created blog post: ${post.title}`);
      } else {
        console.log(`Blog post already exists: ${post.title}`);
      }
    }
    
    // Create sample courses
    const courses = [
      {
        title: 'Complete Web Development Bootcamp',
        slug: 'complete-web-development-bootcamp',
        description: 'Learn full-stack web development from scratch. Covers HTML, CSS, JavaScript, React, Node.js, and databases.',
        shortDescription: 'Full-stack web development course',
        price: 99.99,
        duration: 40,
        isPublished: true,
        packageTypes: ['SILVER', 'GOLD', 'PLATINUM'],
        metaTitle: 'Complete Web Development Bootcamp',
        metaDescription: 'Learn full-stack web development from scratch'
      },
      {
        title: 'Advanced React Development',
        slug: 'advanced-react-development',
        description: 'Master advanced React concepts including hooks, context, performance optimization, and testing.',
        shortDescription: 'Advanced React programming course',
        price: 149.99,
        duration: 25,
        isPublished: true,
        packageTypes: ['GOLD', 'PLATINUM'],
        metaTitle: 'Advanced React Development',
        metaDescription: 'Master advanced React concepts and techniques'
      },
      {
        title: 'Node.js Backend Development',
        slug: 'nodejs-backend-development',
        description: 'Build scalable backend applications with Node.js, Express, and MongoDB.',
        shortDescription: 'Backend development with Node.js',
        price: 129.99,
        duration: 30,
        isPublished: true,
        packageTypes: ['SILVER', 'GOLD', 'PLATINUM'],
        metaTitle: 'Node.js Backend Development',
        metaDescription: 'Build scalable backend applications with Node.js'
      }
    ];
    
    // Create courses
    for (const course of courses) {
      const existingCourse = await prisma.course.findUnique({
        where: { slug: course.slug }
      });
      
      if (!existingCourse) {
        const createdCourse = await prisma.course.create({ data: course });
        console.log(`Created course: ${course.title}`);
        
        // Create sample modules for each course
        const modules = [
          {
            title: 'Introduction',
            description: 'Course introduction and overview',
            courseId: createdCourse.id,
            order: 1,
            duration: 5, // 5 minutes
            videoUrl: 'https://example.com/video1.mp4'
          },
          {
            title: 'Getting Started',
            description: 'Setting up your development environment',
            courseId: createdCourse.id,
            order: 2,
            duration: 10, // 10 minutes
            videoUrl: 'https://example.com/video2.mp4'
          },
          {
            title: 'Core Concepts',
            description: 'Understanding the fundamental concepts',
            courseId: createdCourse.id,
            order: 3,
            duration: 15, // 15 minutes
            videoUrl: 'https://example.com/video3.mp4'
          }
        ];
        
        for (const module of modules) {
          await prisma.courseModule.create({ data: module });
        }
        
        console.log(`Created ${modules.length} modules for course: ${course.title}`);
      } else {
        console.log(`Course already exists: ${course.title}`);
      }
    }
    
    console.log('\n✅ Blog and course test data setup completed!');
    
    // Display summary
    const blogCount = await prisma.blogPost.count();
    const courseCount = await prisma.course.count();
    const moduleCount = await prisma.courseModule.count();
    
    console.log(`\nSummary:`);
    console.log(`- Blog posts: ${blogCount}`);
    console.log(`- Courses: ${courseCount}`);
    console.log(`- Course modules: ${moduleCount}`);
    
  } catch (error) {
    console.error('Error setting up blog and course data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupBlogAndCourseData();
}

module.exports = { setupBlogAndCourseData };