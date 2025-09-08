import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Paths that require authentication
const PROTECTED_PATHS = [
  '/api/dashboard',
  '/api/courses/enroll',
  '/api/payments',
  '/api/withdrawals',
  '/api/auth/user',
  '/api/auth/kyc',
  '/dashboard',
  '/courses/learn',
  '/purchase'
];

// Paths that require admin role
const ADMIN_PATHS = [
  '/api/admin',
  '/admin'
];

export async function authenticateRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip authentication for non-protected paths
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    pathname.startsWith(path)
  );
  
  if (!isProtectedPath) {
    return null;
  }
  
  try {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check for admin paths
    const isAdminPath = ADMIN_PATHS.some(path => 
      pathname.startsWith(path)
    );
    
    if (isAdminPath) {
      // Here you would typically check the user's role in the database
      // For now, we'll just check if the user has an admin email domain
      const userEmail = session.user.email;
      if (!userEmail || !userEmail.includes('@admin.com')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }
    
    // Add user info to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-email', session.user.email || '');
    
    return null; // No error, continue with the request
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}