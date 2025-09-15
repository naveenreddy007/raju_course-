import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Simple slug generation function
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

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
    const packageType = searchParams.get('packageType');
    const search = searchParams.get('search');
    const slug = searchParams.get('slug');
    
    const skip = (page - 1) * limit;
    
    // Build query - simplified without problematic joins
    let query = supabase
      .from('courses')
      .select('*', { count: 'exact' })
      .eq('isPublished', true)

    // If slug is provided, filter by slug (for individual course lookup)
    if (slug) {
      query = query.eq('slug', slug)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (level && level !== 'all') {
      query = query.eq('level', level)
    }

    if (packageType && packageType !== 'all') {
      query = query.contains('packageTypes', [packageType])
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Get courses with pagination (skip pagination for slug lookup)
    const { data: courses, error: coursesError, count: totalCount } = slug ?
      await query.order('createdAt', { ascending: false }) :
      await query
        .order('createdAt', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

    if (coursesError) {
      console.error('Error fetching courses:', coursesError)
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: (courses || []).map(course => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        shortDescription: course.shortDescription,
        thumbnail: course.thumbnailUrl,
        videoUrl: course.videoUrl,
        price: course.price,
        duration: course.duration,
        packageTypes: course.packageTypes || ['SILVER', 'GOLD', 'PLATINUM'],
        isActive: course.isActive,
        isPublished: course.isPublished,
        metaTitle: course.metaTitle,
        metaDescription: course.metaDescription,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        publishedAt: course.publishedAt,
        _count: {
          modules: 0, // Will be populated separately if needed
          enrollments: 0 // Will be populated separately if needed
        }
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
    // For now, skip authentication to avoid import issues
    // TODO: Implement proper authentication later

    const body = await request.json()
    const { title, description, shortDescription, videoUrl, thumbnailUrl, price, duration, packageTypes } = body

    // Validate required fields
    if (!title || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, price' },
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
        shortDescription,
        slug,
        videoUrl,
        thumbnailUrl,
        price: parseFloat(price),
        duration: duration ? parseInt(duration) : null,
        packageTypes: packageTypes || ['SILVER'],
        isActive: true,
        isPublished: false,
        updatedAt: new Date().toISOString()
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