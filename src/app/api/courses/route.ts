import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { generateSlug } from '@/lib/utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/courses - List courses with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('courses')
      .select(`
        *,
        lessons:lessons(count),
        enrollments:enrollments(count)
      `, { count: 'exact' })
      .eq('published', true)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (level && level !== 'all') {
      query = query.eq('level', level)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Get courses with pagination
    const { data: courses, error: coursesError, count: totalCount } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    return NextResponse.json({
      courses: (courses || []).map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        price: course.price,
        originalPrice: course.original_price,
        category: course.category,
        level: course.level,
        duration: course.duration,
        moduleCount: course.lessons?.[0]?.count || 0,
        enrollmentCount: course.enrollments?.[0]?.count || 0,
        rating: course.rating,
        createdAt: course.created_at,
      })),
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit),
      },
    })

  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch courses'
      },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, level, price, originalPrice, duration, thumbnail } = body

    // Validate required fields
    if (!title || !description || !category || !level || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate slug from title
    const slug = generateSlug(title)

    // Check if slug already exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this title already exists' },
        { status: 409 }
      )
    }

    // Create course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title,
        description,
        slug,
        category,
        level,
        price: parseFloat(price),
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        duration: duration ? parseInt(duration) : null,
        thumbnail,
        instructor_email: session.user.email,
        published: false,
      })
      .select()
      .single()

    if (courseError) {
      console.error('Error creating course:', courseError)
      return NextResponse.json(
        { error: 'Failed to create course' },
        { status: 500 }
      )
    }

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}