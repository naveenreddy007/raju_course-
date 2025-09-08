import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { APIError, authenticateUser, requireAdmin, validateRequestBody, validateQueryParams, schemas } from '@/lib/api-utils';
import { withRateLimit } from '@/middleware/rate-limit';
import { z } from 'zod';

const moduleCreateSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().min(0).optional(),
  order: z.number().min(0).optional(),
  isPreview: z.boolean().default(false),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['PDF', 'VIDEO', 'LINK', 'DOCUMENT'])
  })).optional()
});

const moduleUpdateSchema = moduleCreateSchema.partial().omit({ courseId: true });

// GET /api/courses/modules - Get course modules
export const GET = withRateLimit(async function(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const queryData = await validateQueryParams(request, schemas.pagination.extend({
      courseId: z.string().uuid(),
      includeContent: z.boolean().default(false)
    }));

    const { page, limit, courseId, includeContent } = queryData;
    const skip = (page - 1) * limit;

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        status: true,
        instructorId: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user has access to view modules
    let canViewContent = false;
    let userId = null;
    
    try {
      const { user } = await authenticateUser(request);
      userId = user.id;
      
      // Check if user is admin, instructor, or enrolled
      const userRecord = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const isAdmin = userRecord?.role === 'ADMIN';
      const isInstructor = course.instructorId === userId;
      
      let isEnrolled = false;
      if (!isAdmin && !isInstructor) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId
            }
          },
          select: { status: true }
        });
        isEnrolled = enrollment?.status === 'ACTIVE';
      }

      canViewContent = isAdmin || isInstructor || isEnrolled;
    } catch (error) {
      // User not authenticated, can only view preview modules
      canViewContent = false;
    }

    // Get modules
    const modules = await prisma.courseModule.findMany({
      where: { courseId },
      skip,
      take: limit,
      orderBy: {
        order: 'asc'
      },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        order: true,
        isPreview: true,
        videoUrl: true,
        content: includeContent,
        resources: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Filter content based on access
    const filteredModules = modules.map(courseModule => {
      if (!canViewContent && !courseModule.isPreview) {
        return {
          ...courseModule,
          videoUrl: null,
          content: null,
          resources: null,
          locked: true
        };
      }
      return {
        ...courseModule,
        locked: false
      };
    });

    const totalCount = await prisma.courseModule.count({
      where: { courseId }
    });

    logger.info(`Retrieved course modules`, {
      courseId,
      moduleCount: modules.length,
      canViewContent,
      requestedBy: userId || 'anonymous'
    });

    return NextResponse.json({
      success: true,
      data: {
        modules: filteredModules,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        course: {
          id: course.id,
          title: course.title
        },
        access: {
          canViewContent,
          requiresEnrollment: !canViewContent
        }
      }
    });

  } catch (error) {
    logger.error('Failed to fetch course modules:', error);
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course modules' },
      { status: 500 }
    );
  }
});

// POST /api/courses/modules - Create a new module (Admin/Instructor only)
export const POST = withRateLimit(async function(request: NextRequest) {
  try {
    // Require authentication
    const { user } = await authenticateUser(request);
    const userId = user.id;

    // Validate request body
    const validatedData = await validateRequestBody(request, moduleCreateSchema);
    const { courseId, title, description, content, videoUrl, duration, order, isPreview, resources } = validatedData;

    // Verify course exists and user has permission
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        instructorId: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user is admin or instructor
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const isAdmin = userRecord?.role === 'ADMIN';
    const isInstructor = course.instructorId === userId;

    if (!isAdmin && !isInstructor) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get next order if not provided
    let moduleOrder = order;
    if (moduleOrder === undefined) {
      const lastModule = await prisma.courseModule.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      moduleOrder = (lastModule?.order || 0) + 1;
    }

    // Create the module
    const newModule = await prisma.courseModule.create({
      data: {
        courseId,
        title,
        description,
        content,
        videoUrl,
        duration,
        order: moduleOrder,
        isPreview,
        resources: resources || []
      },
      include: {
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    logger.info(`Course module created successfully`, {
      moduleId: module.id,
      courseId,
      title: module.title,
      createdBy: userId
    });

    return NextResponse.json(
      {
        success: true,
        data: module,
        message: 'Module created successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    logger.error('Failed to create course module:', error);
    if (error instanceof APIError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create course module' },
      { status: 500 }
    );
  }
});