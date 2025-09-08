import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  handleAPIError, 
  validateRequestBody,
  validateQueryParams,
  requireAuth,
  createSuccessResponse,
  createPaginationResponse,
  logger,
  paginationSchema
} from '@/lib/api-utils';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const progressUpdateSchema = z.object({
  courseId: z.string().uuid(),
  moduleId: z.string().uuid(),
  completed: z.boolean(),
  timeSpent: z.number().min(0).optional(),
  lastPosition: z.number().min(0).optional(),
  notes: z.string().optional()
});

// GET /api/courses/progress - Get user's course progress
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const { user } = await requireAuth(request);
    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validatedQuery = validateQueryParams(paginationSchema.extend({
      courseId: z.string().uuid().optional(),
      status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional()
    }), queryParams);

    const { page = 1, limit = 10, courseId, status } = validatedQuery;
    const skip = (page - 1) * limit;

    // Build where clause for enrollments
    const where: any = {
      userId,
      status: 'ACTIVE' // Only active enrollments
    };

    if (courseId) {
      where.courseId = courseId;
    }

    // Get user's enrollments with progress
    const enrollments = await prisma.enrollment.findMany({
      where,
      skip,
      take: limit,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            description: true,
            level: true,
            duration: true,
            instructor: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            _count: {
              select: {
                modules: true
              }
            }
          }
        },
        userProgress: {
          include: {
            module: {
              select: {
                id: true,
                title: true,
                duration: true,
                order: true
              }
            }
          },
          orderBy: {
            module: {
              order: 'asc'
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    // Calculate progress statistics for each course
    const progressData = enrollments.map(enrollment => {
      const totalModules = enrollment.course._count.modules;
      const completedModules = enrollment.userProgress.filter(p => p.completed).length;
      const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
      
      // Calculate total time spent
      const totalTimeSpent = enrollment.userProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
      
      // Determine status
      let courseStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      if (completedModules === 0) {
        courseStatus = 'NOT_STARTED';
      } else if (completedModules === totalModules && totalModules > 0) {
        courseStatus = 'COMPLETED';
      } else {
        courseStatus = 'IN_PROGRESS';
      }

      return {
        courseId: enrollment.courseId,
        course: {
          ...enrollment.course,
          _count: undefined
        },
        enrollment: {
          id: enrollment.id,
          enrolledAt: enrollment.enrolledAt,
          status: enrollment.status,
          progress: enrollment.progress
        },
        progress: {
          totalModules,
          completedModules,
          progressPercentage,
          totalTimeSpent,
          status: courseStatus,
          lastAccessedAt: enrollment.userProgress.length > 0 
            ? Math.max(...enrollment.userProgress.map(p => new Date(p.updatedAt).getTime()))
            : null,
          moduleProgress: enrollment.userProgress
        }
      };
    });

    // Filter by status if specified
    const filteredData = status 
      ? progressData.filter(item => item.progress.status === status)
      : progressData;

    const totalCount = await prisma.enrollment.count({ where });

    logger.info(`Retrieved course progress for user`, {
      userId,
      courseCount: filteredData.length,
      filters: { courseId, status }
    });

    return NextResponse.json({
      success: true,
      data: filteredData,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    return handleAPIError(error, 'Failed to fetch course progress');
  }
}

// POST /api/courses/progress - Update user's module progress
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const { user } = await requireAuth(request);
    const userId = user.id;

    // Validate request body
    const body = await request.json();
    const validatedData = validateRequestBody(progressUpdateSchema, body);
    const { courseId, moduleId, completed, timeSpent, lastPosition, notes } = validatedData;

    // Verify user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      select: {
        id: true,
        status: true,
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }

    if (enrollment.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Your enrollment is not active' },
        { status: 403 }
      );
    }

    // Verify module belongs to the course
    const courseModule = await prisma.courseModule.findFirst({
      where: {
        id: moduleId,
        courseId
      },
      select: {
        id: true,
        title: true,
        order: true,
        duration: true
      }
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found in this course' },
        { status: 404 }
      );
    }

    // Update or create progress record
    const progress = await prisma.userProgress.upsert({
      where: {
        userId_courseId_moduleId: {
          userId,
          courseId,
          moduleId
        }
      },
      update: {
        completed,
        timeSpent: timeSpent !== undefined ? timeSpent : undefined,
        lastPosition: lastPosition !== undefined ? lastPosition : undefined,
        notes: notes !== undefined ? notes : undefined,
        updatedAt: new Date()
      },
      create: {
        userId,
        courseId,
        moduleId,
        completed,
        timeSpent: timeSpent || 0,
        lastPosition: lastPosition || 0,
        notes: notes || null
      },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            order: true,
            duration: true
          }
        }
      }
    });

    // Calculate overall course progress
    const allProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        courseId
      },
      select: {
        completed: true
      }
    });

    const totalModules = await prisma.courseModule.count({
      where: { courseId }
    });

    const completedModules = allProgress.filter(p => p.completed).length;
    const overallProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    // Update enrollment progress
    await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      data: {
        progress: overallProgress,
        lastAccessedAt: new Date()
      }
    });

    logger.info(`Module progress updated`, {
      userId,
      courseId,
      moduleId,
      completed,
      overallProgress,
      timeSpent
    });

    return createSuccessResponse({
      progress,
      courseProgress: {
        totalModules,
        completedModules,
        overallProgress,
        status: overallProgress === 100 ? 'COMPLETED' : overallProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'
      }
    }, 'Progress updated successfully');

  } catch (error) {
    return handleAPIError(error, 'Failed to update progress');
  }
}