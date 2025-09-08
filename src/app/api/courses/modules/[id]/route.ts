import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  handleAPIError, 
  validateRequestBody,
  requireAuth,
  createSuccessResponse,
  logger
} from '@/lib/api-utils';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: {
    id: string;
  };
}

const moduleUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().min(0).optional(),
  order: z.number().min(0).optional(),
  isPreview: z.boolean().optional(),
  resources: z.array(z.object({
    title: z.string(),
    url: z.string().url(),
    type: z.enum(['PDF', 'VIDEO', 'LINK', 'DOCUMENT'])
  })).optional()
});

// GET /api/courses/modules/[id] - Get specific module details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: moduleId } = params;

    // Get module with course info
    const courseModule = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            status: true,
            instructorId: true
          }
        }
      }
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    // Check if user has access to view module content
    const authResult = await requireAuth(request);
    let canViewContent = false;
    
    if (!authResult.error) {
      const userId = user.id;
      
      // Check if user is admin, instructor, or enrolled
      const userRole = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

      const isAdmin = userRole?.role === 'ADMIN';
      const isInstructor = module.course.instructorId === userId;
      
      let isEnrolled = false;
      if (!isAdmin && !isInstructor) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: module.courseId
            }
          },
          select: { status: true }
        });
        isEnrolled = enrollment?.status === 'ACTIVE';
      }

      canViewContent = isAdmin || isInstructor || isEnrolled;
    }

    // Filter content based on access
    const moduleData = {
      ...module,
      videoUrl: (canViewContent || module.isPreview) ? module.videoUrl : null,
      content: (canViewContent || module.isPreview) ? module.content : null,
      resources: (canViewContent || module.isPreview) ? module.resources : null,
      locked: !canViewContent && !module.isPreview
    };

    logger.info(`Module details retrieved`, {
      moduleId,
      courseId: module.courseId,
      canViewContent,
      isPreview: module.isPreview,
      requestedBy: authResult.error ? 'anonymous' : user.id
    });

    return createSuccessResponse(moduleData, 'Module details retrieved successfully');

  } catch (error) {
    return handleAPIError(error, 'Failed to fetch module details');
  }
}

// PUT /api/courses/modules/[id] - Update module (Admin/Instructor only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: moduleId } = params;

    // Require authentication
    const { user } = await requireAuth(request);
    const userId = user.id;

    // Check if module exists
    const existingModule = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true
          }
        }
      }
    });

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const userRole = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const isAdmin = userRole?.role === 'ADMIN';
    const isInstructor = existingModule.course.instructorId === userId;

    if (!isAdmin && !isInstructor) {
      return NextResponse.json(
        { error: 'You do not have permission to update this module' },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = validateRequestBody(moduleUpdateSchema, body);

    // Handle order conflicts if order is being updated
    if (validatedData.order !== undefined && validatedData.order !== existingModule.order) {
      const conflictingModule = await prisma.courseModule.findFirst({
        where: {
          courseId: existingModule.courseId,
          order: validatedData.order,
          id: { not: moduleId }
        }
      });

      if (conflictingModule) {
        // Swap orders
        await prisma.courseModule.update({
          where: { id: conflictingModule.id },
          data: { order: existingModule.order }
        });
      }
    }

    // Update the module
    const updatedModule = await prisma.courseModule.update({
      where: { id: moduleId },
      data: {
        ...validatedData,
        updatedAt: new Date()
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

    logger.info(`Module updated successfully`, {
      moduleId,
      courseId: updatedModule.courseId,
      title: updatedModule.title,
      updatedBy: userId,
      updatedFields: Object.keys(validatedData)
    });

    return createSuccessResponse(updatedModule, 'Module updated successfully');

  } catch (error) {
    return handleAPIError(error, 'Failed to update module');
  }
}

// DELETE /api/courses/modules/[id] - Delete module (Admin/Instructor only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: moduleId } = params;

    // Require authentication
    const { user } = await requireAuth(request);
    const userId = user.id;

    // Check if module exists
    const existingModule = await prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true
          }
        },
        _count: {
          select: {
            userProgress: true
          }
        }
      }
    });

    if (!existingModule) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const userRole = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const isAdmin = userRole?.role === 'ADMIN';
    const isInstructor = existingModule.course.instructorId === userId;

    if (!isAdmin && !isInstructor) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this module' },
        { status: 403 }
      );
    }

    // Check if module has user progress
    if (existingModule._count.userProgress > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete module with existing user progress. Consider archiving instead.',
          progressCount: existingModule._count.userProgress
        },
        { status: 409 }
      );
    }

    // Delete module and reorder remaining modules
    await prisma.$transaction(async (tx) => {
      // Delete the module
      await tx.courseModule.delete({
        where: { id: moduleId }
      });

      // Reorder remaining modules
      const remainingModules = await tx.courseModule.findMany({
        where: {
          courseId: existingModule.courseId,
          order: { gt: existingModule.order }
        },
        orderBy: { order: 'asc' }
      });

      // Update order for remaining modules
      for (let i = 0; i < remainingModules.length; i++) {
        await tx.courseModule.update({
          where: { id: remainingModules[i].id },
          data: { order: existingModule.order + i }
        });
      }
    });

    logger.info(`Module deleted successfully`, {
      moduleId,
      courseId: existingModule.courseId,
      title: existingModule.title,
      order: existingModule.order,
      deletedBy: userId
    });

    return createSuccessResponse(
      { 
        id: moduleId,
        title: existingModule.title,
        courseId: existingModule.courseId,
        reorderedModules: true
      }, 
      'Module deleted successfully'
    );

  } catch (error) {
    return handleAPIError(error, 'Failed to delete module');
  }
}