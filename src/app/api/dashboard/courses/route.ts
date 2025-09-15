import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-utils-simple'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await requireAuth(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Get user's enrolled courses
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses:course_id (
          *,
          lessons (*)
        ),
        progress:course_progress (*)
      `)
      .eq('user_id', userId);

    if (enrollmentError) {
      console.error('Error fetching enrollments:', enrollmentError);
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }

    // Process courses with progress
    const coursesWithProgress = (enrollments || []).map((enrollment) => {
      const course = enrollment.courses;
      const progress = enrollment.progress || [];
      
      const totalLessons = course?.lessons?.length || 0;
      const completedLessons = progress.filter((p: any) => p.completed).length;
      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        id: course?.id,
        title: course?.title,
        description: course?.description,
        thumbnail: course?.thumbnail,
        totalLessons,
        completedLessons,
        progressPercentage,
        enrolledAt: enrollment.created_at,
        lastAccessed: enrollment.last_accessed_at,
        purchaseAmount: enrollment.amount || 0,
        purchaseDate: enrollment.created_at,
      };
    });

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