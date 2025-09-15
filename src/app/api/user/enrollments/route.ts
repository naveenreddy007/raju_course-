import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Fetch user's enrollments with course details
    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        progressPercent,
        status,
        createdAt,
        completedAt,
        courseId,
        courses!inner(
          id,
          name,
          slug,
          description,
          thumbnail,
          duration,
          level,
          packageType,
          isPublished,
          createdAt
        )
      `)
      .eq('userId', userId)
      .eq('status', 'ACTIVE')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Fetch enrollments error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    // Transform the data to include course details at the top level
    const transformedEnrollments = enrollments?.map(enrollment => ({
      id: enrollment.id,
      progress: enrollment.progressPercent,
      status: enrollment.status,
      enrolledAt: enrollment.createdAt,
      completedAt: enrollment.completedAt,
      course: {
        id: enrollment.courses.id,
        name: enrollment.courses.name,
        slug: enrollment.courses.slug,
        description: enrollment.courses.description,
        thumbnail: enrollment.courses.thumbnail,
        duration: enrollment.courses.duration,
        level: enrollment.courses.level,
        packageType: enrollment.courses.packageType,
        isPublished: enrollment.courses.isPublished,
        createdAt: enrollment.courses.createdAt
      }
    })) || [];

    return NextResponse.json({
      success: true,
      enrollments: transformedEnrollments,
      total: transformedEnrollments.length
    });

  } catch (error) {
    console.error('User enrollments API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update enrollment progress
export async function PATCH(request: NextRequest) {
  try {
    const { enrollmentId, progress } = await request.json();

    if (!enrollmentId || progress === undefined) {
      return NextResponse.json(
        { error: 'Enrollment ID and progress are required' },
        { status: 400 }
      );
    }

    if (progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Progress must be between 0 and 100' },
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

    // Update enrollment progress
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .update({ 
        progressPercent: progress,
        completedAt: progress === 100 ? new Date().toISOString() : null,
        status: progress === 100 ? 'COMPLETED' : 'ACTIVE'
      })
      .eq('id', enrollmentId)
      .eq('userId', user.id) // Ensure user can only update their own enrollments
      .select()
      .single();

    if (error) {
      console.error('Update enrollment progress error:', error);
      return NextResponse.json(
        { error: 'Failed to update progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      enrollment
    });

  } catch (error) {
    console.error('Update enrollment progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}