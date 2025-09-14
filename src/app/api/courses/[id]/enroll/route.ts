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

const enrollmentSchema = z.object({
  paymentMethod: z.enum(['RAZORPAY', 'STRIPE', 'FREE']).default('RAZORPAY'),
  paymentId: z.string().optional(),
  couponCode: z.string().optional(),
  referralCode: z.string().optional()
});

// POST /api/courses/[id]/enroll - Enroll user in course
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: courseId } = params;

    // Require authentication
    const { user } = await requireAuth(request);
    const userId = user.id;

    // Validate request body
    const validatedData = await validateRequestBody(request, enrollmentSchema);
    const { paymentMethod, paymentId, couponCode, referralCode } = validatedData;

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        price: true,
        isPublished: true,
        packageTypes: true
      }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { error: 'Course is not available for enrollment' },
        { status: 400 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'You are already enrolled in this course' },
        { status: 409 }
      );
    }

    // Calculate final price
    let finalPrice = course.price;
    let discountAmount = 0;
    let couponDiscount = 0;

    // Apply coupon if provided
    if (couponCode) {
      // Note: Implement coupon logic here when coupon system is added
      // For now, we'll skip coupon validation
    }

    // Handle referral if provided
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await prisma.affiliate.findUnique({
        where: { referralCode: referralCode },
        include: { user: { select: { id: true, name: true } } }
      });

      if (referrer && referrer.userId !== userId) {
        referrerId = referrer.userId;
      }
    }

    // For free courses or when price is 0
    if (finalPrice === 0 || paymentMethod === 'FREE') {
      finalPrice = 0;
      paymentMethod === 'FREE';
    }

    // Start transaction for enrollment
    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          amount: finalPrice,
          type: 'COURSE_PURCHASE',
          status: finalPrice === 0 ? 'SUCCESS' : 'PENDING',
          paymentMethod,
          paymentId: paymentId || null,
          description: `Enrollment for course: ${course.title}`,
          metadata: {
            courseId,
            courseName: course.title,
            originalPrice: course.price,
            couponCode,
            couponDiscount,
            referralCode,
            referrerId,
            currency: 'INR'
          }
        }
      });

      // Create enrollment
      const enrollment = await tx.enrollment.create({
        data: {
          userId,
          courseId,
          transactionId: transaction.id,
          status: finalPrice === 0 ? 'ACTIVE' : 'ACTIVE' // All enrollments are active once created
        },
        include: {
          course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true
          }
        },
          transaction: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true
            }
          }
        }
      });

      // If free course, create referral record if applicable
      if (finalPrice === 0) {
        // Create referral record if applicable
        if (referrerId) {
          await tx.referral.create({
            data: {
              referrerId,
              referredId: userId,
              courseId,
              status: 'COMPLETED',
              commissionEarned: 0 // No commission for free courses
            }
          });
        }
      }

      return { enrollment, transaction };
    });

    logger.info(`Course enrollment ${finalPrice === 0 ? 'completed' : 'initiated'}`, {
      userId,
      courseId,
      transactionId: result.transaction.id,
      amount: finalPrice,
      paymentMethod,
      referrerId
    });

    // For paid courses, return payment information
    if (finalPrice > 0) {
      return createSuccessResponse({
        enrollment: result.enrollment,
        transaction: result.transaction,
        paymentRequired: true,
        amount: finalPrice,
        currency: 'INR',
        message: 'Enrollment initiated. Please complete payment to activate your enrollment.'
      }, 201, 'Enrollment initiated successfully');
    }

    // For free courses, enrollment is complete
    return createSuccessResponse({
      enrollment: result.enrollment,
      transaction: result.transaction,
      paymentRequired: false,
      message: 'You have been successfully enrolled in this course!'
    }, 201, 'Enrollment completed successfully');

  } catch (error) {
    return handleAPIError(error, 'Failed to enroll in course');
  }
}

// GET /api/courses/[id]/enroll - Check enrollment status
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: courseId } = params;

    // Require authentication
    const { user } = await requireAuth(request);
    const userId = user.id;

    // Check enrollment status
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnailUrl: true
          }
        },
        transaction: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentMethod: true,
            createdAt: true
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { 
          enrolled: false,
          message: 'You are not enrolled in this course'
        },
        { status: 404 }
      );
    }

    return createSuccessResponse({
      enrolled: true,
      enrollment,
      status: enrollment.status,
      enrolledAt: enrollment.createdAt,
      progress: enrollment.progressPercent
    }, 200, 'Enrollment status retrieved successfully');

  } catch (error) {
    return handleAPIError(error, 'Failed to check enrollment status');
  }
}