import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { courseId, userId } = await request.json();

    if (!courseId || !userId) {
      return NextResponse.json(
        { error: 'Course ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already enrolled
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('userId', userId)
      .eq('courseId', courseId)
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, name, packageType, isPublished')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
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

    // Get user's active package
    const { data: userPackage, error: packageError } = await supabase
      .from('package_purchases')
      .select(`
        id,
        packageId,
        packages!inner(
          id,
          name,
          packageType
        )
      `)
      .eq('userId', userId)
      .eq('status', 'active')
      .single();

    if (packageError || !userPackage) {
      return NextResponse.json(
        { error: 'No active package found. Please purchase a package first.' },
        { status: 400 }
      );
    }

    // Check package eligibility
    const userPackageType = userPackage.packages.packageType;
    const coursePackageType = course.packageType;

    // Package hierarchy: basic < standard < premium
    const packageHierarchy = {
      'basic': 1,
      'standard': 2,
      'premium': 3
    };

    const userLevel = packageHierarchy[userPackageType as keyof typeof packageHierarchy] || 0;
    const requiredLevel = packageHierarchy[coursePackageType as keyof typeof packageHierarchy] || 0;

    if (userLevel < requiredLevel) {
      return NextResponse.json(
        { error: `This course requires a ${coursePackageType} package or higher. Your current package: ${userPackageType}` },
        { status: 403 }
      );
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        userId,
        courseId,
        transactionId: 'direct-enrollment', // Default for direct enrollments
        progressPercent: 0,
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Enrollment error:', enrollmentError);
      return NextResponse.json(
        { error: 'Failed to enroll in course' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in course',
      enrollment
    });

  } catch (error) {
    console.error('Enrollment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get enrollment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');

    if (!courseId || !userId) {
      return NextResponse.json(
        { error: 'Course ID and User ID are required' },
        { status: 400 }
      );
    }

    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id, progressPercent, status, createdAt, completedAt')
      .eq('userId', userId)
      .eq('courseId', courseId)
      .single();

    return NextResponse.json({
      enrolled: !!enrollment,
      enrollment
    });

  } catch (error) {
    console.error('Get enrollment status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}