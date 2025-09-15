import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCourses() {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        packageTypes: true,
        isPublished: true
      }
    });

    console.log('\nCourses with pricing:');
    console.log('='.repeat(50));
    
    courses.forEach(course => {
      const packageTypes = course.packageTypes ? course.packageTypes.join(', ') : 'none';
      const status = course.isPublished ? 'Published' : 'Draft';
      console.log(`- ${course.title}`);
      console.log(`  Price: ₹${course.price}`);
      console.log(`  Packages: ${packageTypes}`);
      console.log(`  Status: ${status}`);
      console.log('');
    });

    console.log(`Total courses: ${courses.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourses();