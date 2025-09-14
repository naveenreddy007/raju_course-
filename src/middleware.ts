import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './middleware/rateLimiter';
import { authenticateRequest } from './middleware/auth';
import { validateRequest } from './middleware/validation';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  
  // Apply middlewares in order for API routes
  if (pathname.startsWith('/api/')) {
    try {
      // 1. Rate limiting
      const rateLimitResponse = rateLimit(request);
      if (rateLimitResponse && typeof rateLimitResponse === 'object' && 'allowed' in rateLimitResponse && !rateLimitResponse.allowed) {
        return rateLimitResponse;
      }
      
      // 2. Input validation
      const validationResponse = await validateRequest(request);
      if (validationResponse) {
        return validationResponse;
      }
      
      // 3. Authentication
      const authResponse = await authenticateRequest(request);
      if (authResponse) {
        return authResponse;
      }
      
      // Add security headers
      const response = NextResponse.next();
      
      // Security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      
      // CORS headers for production
      if (process.env.NODE_ENV === 'production') {
        const allowedOrigins = [
          process.env.NEXTAUTH_URL,
          process.env.NEXT_PUBLIC_APP_URL
        ].filter(Boolean);
        
        const origin = request.headers.get('origin');
        if (origin && allowedOrigins.includes(origin)) {
          response.headers.set('Access-Control-Allow-Origin', origin);
        }
        
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400');
      }
      
      return response;
      
    } catch (error) {
      console.error('Middleware error:', error);
      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An error occurred processing your request'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
  
  // For non-API routes, just add security headers
  const response = NextResponse.next();
  
  // Security headers for all routes
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' http://localhost:8000 https://yrpcgkrichksljfrtmvs.supabase.co https://api.razorpay.com https://api.stripe.com",
    "frame-src https://checkout.razorpay.com https://js.stripe.com"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
