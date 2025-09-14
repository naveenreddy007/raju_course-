const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const courseId = 'cmfjgahwg0009far79wapfefw';

async function debugCourseInDB() {
  try {
    console.log(`Debugging course ID: ${courseId}`);
    
    // Check if course exists with basic query
    const basicCourse = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        isActive: true,
        isPublished: true
      }
    });
    
    console.log('Basic course query result:', basicCourse);
    
    if (basicCourse) {
      // Try the same query as the API
      const fullCourse = await prisma.course.findFirst({
        where: { id: courseId },
        include: {
          modules: {
            orderBy: {
              order: 'asc'
            },
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
              order: true,
              videoUrl: true,
              isActive: true,
              isFree: true
            }
          },
          _count: {
            select: {
              enrollments: true,
              modules: true
            }
          }
        }
      });
      
      console.log('Full course query result:', fullCourse ? 'Found' : 'Not found');
      if (fullCourse) {
        console.log('Course details:', {
          id: fullCourse.id,
          title: fullCourse.title,
          moduleCount: fullCourse._count.modules,
          enrollmentCount: fullCourse._count.enrollments
        });
      }
    }
    
    // Check if there are any modules for this course
    const modules = await prisma.module.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        courseId: true
      }
    });
    
    console.log(`Found ${modules.length} modules for this course:`, modules);
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCourseInDB().catch(console.error);