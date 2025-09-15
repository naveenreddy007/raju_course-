import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  handleAPIError, 
  validateRequestBody,
  requireAuth,
  createSuccessResponse,
  logger
} from '@/lib/api-utils';

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
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price, is_published, package_types')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    if (!course.is_published) {
      return NextResponse.json(
        { error: 'Course is not available for enrollment' },
        { status: 400 }
      );
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

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
      const { data: referrer } = await supabase
        .from('affiliates')
        .select('user_id, users(id, name)')
        .eq('referral_code', referralCode)
        .single();

      if (referrer && referrer.user_id !== userId) {
        referrerId = referrer.user_id;
      }
    }

    // For free courses or when price is 0
    if (finalPrice === 0 || paymentMethod === 'FREE') {
      finalPrice = 0;
      paymentMethod === 'FREE';
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: finalPrice,
        type: 'COURSE_PURCHASE',
        status: finalPrice === 0 ? 'SUCCESS' : 'PENDING',
        payment_method: paymentMethod,
        payment_id: paymentId || null,
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
      })
      .select()
      .single();

    if (transactionError) {
      throw new Error(`Failed to create transaction: ${transactionError.message}`);
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        transaction_id: transaction.id,
        status: 'ACTIVE' // All enrollments are active once created
      })
      .select(`
        *,
        courses(id, title, thumbnail_url),
        transactions(id, amount, status, payment_method)
      `)
      .single();

    if (enrollmentError) {
      throw new Error(`Failed to create enrollment: ${enrollmentError.message}`);
    }

    // If free course, create referral record if applicable
    if (finalPrice === 0 && referrerId) {
      await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: userId,
          course_id: courseId,
          status: 'COMPLETED',
          commission_earned: 0 // No commission for free courses
        });
    }

    const result = { enrollment, transaction };

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
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses(id, title, thumbnail_url),
        transactions(id, amount, status, payment_method, created_at)
      `)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError && enrollmentError.code !== 'PGRST116') {
      throw new Error(`Failed to check enrollment: ${enrollmentError.message}`);
    }

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
      enrolledAt: enrollment.created_at,
      progress: enrollment.progress_percent
    }, 200, 'Enrollment status retrieved successfully');

  } catch (error) {
    return handleAPIError(error, 'Failed to check enrollment status');
  }
}