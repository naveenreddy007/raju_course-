import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils-simple';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const userId = user.id;

    // Get user's enrolled courses
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
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get progress for each course
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalModules = enrollment.course._count.modules;
        
        // Get completed modules count
        const completedModules = await prisma.userProgress.count({
          where: {
            userId,
            module: {
              courseId: enrollment.courseId
            },
            completed: true
          }
        });

        const progressPercentage = totalModules > 0 
          ? Math.round((completedModules / totalModules) * 100)
          : 0;

        return {
          id: enrollment.id,
          enrolledAt: enrollment.createdAt,
          course: {
            id: enrollment.course.id,
            title: enrollment.course.title,
            description: enrollment.course.description,
            level: enrollment.course.level,
            category: enrollment.course.category,
            duration: enrollment.course.duration,
            totalModules,
            completedModules,
            progressPercentage
          },
          transaction: enrollment.transaction
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: coursesWithProgress
    });

  } catch (error) {
    console.error('Dashboard courses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrolled courses' },
      { status: 500 }
    );
  }
}