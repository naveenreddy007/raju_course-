import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  handleAPIError, 
  validateRequestBody,
  requireAuth,
  requireAdmin,
  createSuccessResponse,
  logger,
  courseCreateSchema
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

// GET /api/courses/[id] - Get course details
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Check if id is a valid CUID (starts with 'c' and is 25 chars) or UUID, otherwise treat as slug
    const isCUID = /^c[a-z0-9]{24}$/i.test(id);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isId = isCUID || isUUID;
    
    const course = await prisma.course.findFirst({
      where: isId ? { id } : { slug: id },
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

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Calculate total duration from modules
    const totalDuration = course.modules.reduce((total, module) => {
      return total + (module.duration || 0);
    }, 0);

    // Format course details for response
    const courseDetails = {
      id: course.id,
      title: course.title,
      description: course.description,
      shortDescription: course.shortDescription,
      slug: course.slug,
      price: course.price,
      packageTypes: course.packageTypes,
      videoUrl: course.videoUrl,
      thumbnailUrl: course.thumbnailUrl,
      duration: totalDuration,
      isActive: course.isActive,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
      publishedAt: course.publishedAt,
      modules: course.modules,
      enrollmentCount: course._count.enrollments,
      moduleCount: course._count.modules,
      metaTitle: course.metaTitle,
      metaDescription: course.metaDescription
    };

    logger.info(`Course details retrieved`, {
      courseId: course.id,
      title: course.title,
      accessedBy: isId ? 'id' : 'slug'
    });

    return createSuccessResponse(courseDetails, 200, 'Course details retrieved successfully');

  } catch (error) {
    return handleAPIError(error, 'Failed to fetch course details');
  }
}

// PUT /api/courses/[id] - Update course (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Require authentication and admin role
    const { user } = await requireAuth(request);

    const adminResult = await requireAdmin(user.id, prisma);
    if (adminResult.error) {
      return adminResult.response;
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Validate request body
    const body = await request.json();
    const updateSchema = courseCreateSchema.partial();
    const validatedData = validateRequestBody(updateSchema, body);

    // Handle slug generation if title is being updated
    let updateData = { ...validatedData };
    
    if (validatedData.title && validatedData.title !== existingCourse.title) {
      const newSlug = validatedData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug conflicts with existing courses
      const slugConflict = await prisma.course.findFirst({
        where: {
          slug: newSlug,
          id: { not: id }
        }
      });

      if (slugConflict) {
        return NextResponse.json(
          { error: 'A course with this title already exists' },
          { status: 409 }
        );
      }

      updateData.slug = newSlug;
    }

    // Verify instructor exists if instructorId is being updated
    if (validatedData.instructorId) {
      const instructor = await prisma.user.findUnique({
        where: { id: validatedData.instructorId },
        select: { id: true, role: true }
      });

      if (!instructor) {
        return NextResponse.json(
          { error: 'Instructor not found' },
          { status: 404 }
        );
      }
    }

    // Update the course
    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
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

    logger.info(`Course updated successfully`, {
      courseId: updatedCourse.id,
      title: updatedCourse.title,
      updatedBy: user.id,
      updatedFields: Object.keys(validatedData)
    });

    return createSuccessResponse({
      ...updatedCourse,
      enrollmentCount: updatedCourse._count.enrollments,
      moduleCount: updatedCourse._count.modules,
      _count: undefined
    }, 200, 'Course updated successfully');

  } catch (error) {
    return handleAPIError(error, 'Failed to update course');
  }
}

// DELETE /api/courses/[id] - Delete course (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Require authentication and admin role
    const { user } = await requireAuth(request);

    const adminResult = await requireAdmin(user.id, prisma);
    if (adminResult.error) {
      return adminResult.response;
    }

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            enrollments: true,
            modules: true
          }
        }
      }
    });

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course has enrollments
    if (existingCourse._count.enrollments > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete course with active enrollments. Archive the course instead.',
          enrollmentCount: existingCourse._count.enrollments
        },
        { status: 409 }
      );
    }

    // Delete course and related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete course modules first
      await tx.courseModule.deleteMany({
        where: { courseId: id }
      });

      // Delete user progress records
      await tx.userProgress.deleteMany({
        where: { courseId: id }
      });

      // Delete the course
      await tx.course.delete({
        where: { id }
      });
    });

    logger.info(`Course deleted successfully`, {
      courseId: id,
      title: existingCourse.title,
      deletedBy: user.id,
      moduleCount: existingCourse._count.modules
    });

    return createSuccessResponse(
      { 
        id, 
        title: existingCourse.title,
        deletedModules: existingCourse._count.modules
      }, 
      200,
      'Course deleted successfully'
    );

  } catch (error) {
    return handleAPIError(error, 'Failed to delete course');
  }
}