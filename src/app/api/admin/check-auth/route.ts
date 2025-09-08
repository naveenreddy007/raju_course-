import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, createAdminAuthResponse } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth(request)
    
    if (!authResult.authorized) {
      return createAdminAuthResponse(authResult.error || 'Unauthorized')
    }

    return NextResponse.json({
      isAdmin: true,
      user: authResult.user,
      isSuperAdmin: authResult.isSuperAdmin
    })
  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json(
      { error: 'Failed to verify admin authentication' },
      { status: 500 }
    )
  }
}