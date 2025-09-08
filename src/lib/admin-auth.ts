import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/types'

export async function checkAdminAuth(request: NextRequest) {
  try {
    // Get session from Supabase
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, error: 'No authentication token provided' }
    }

    const token = authHeader.substring(7)
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return { authorized: false, error: 'Invalid authentication token' }
    }

    // Get user from database to check role
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    if (!dbUser) {
      return { authorized: false, error: 'User not found in database' }
    }

    if (!dbUser.isActive) {
      return { authorized: false, error: 'User account is deactivated' }
    }

    if (dbUser.role !== UserRole.ADMIN && dbUser.role !== UserRole.SUPER_ADMIN) {
      return { authorized: false, error: 'Insufficient permissions - Admin access required' }
    }

    return { 
      authorized: true, 
      user: dbUser,
      isSuperAdmin: dbUser.role === UserRole.SUPER_ADMIN
    }
  } catch (error) {
    console.error('Admin auth check error:', error)
    return { authorized: false, error: 'Authentication check failed' }
  }
}

export function createAdminAuthResponse(error: string) {
  return NextResponse.json(
    { error, message: 'Admin authentication required' },
    { status: 401 }
  )
}

// Helper to check if user has admin role in the auth context
export async function isUserAdmin(supabaseId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { supabaseId },
      select: { role: true, isActive: true }
    })

    return user?.isActive && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}