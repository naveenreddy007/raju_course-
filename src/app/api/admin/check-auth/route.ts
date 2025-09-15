import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils-simple'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    return NextResponse.json({
      isAuthenticated: true,
      user: user
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Failed to verify authentication' },
      { status: 500 }
    )
  }
}