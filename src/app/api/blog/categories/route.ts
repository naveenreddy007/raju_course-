import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/blog/categories - Get all blog categories with post counts
export async function GET(request: NextRequest) {
  try {
    // Since BlogPost doesn't have categories yet, return empty array
    // This can be extended when categories are added to the schema
    const categories = [
      { name: 'General', count: 0 },
      { name: 'Tutorials', count: 0 },
      { name: 'News', count: 0 }
    ];

    return NextResponse.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog categories' },
      { status: 500 }
    );
  }
}