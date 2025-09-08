import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window

export function rateLimit(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  
  // Clean up old entries
  rateLimitStore.forEach((data, key) => {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  });
  
  // Get or create rate limit data for this IP
  let rateLimitData = rateLimitStore.get(ip);
  if (!rateLimitData || rateLimitData.resetTime < now) {
    rateLimitData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    };
    rateLimitStore.set(ip, rateLimitData);
  }
  
  // Check if rate limit exceeded
  if (rateLimitData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitData.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString()
        }
      }
    );
  }
  
  // Increment request count
  rateLimitData.count++;
  
  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
  response.headers.set('X-RateLimit-Remaining', (RATE_LIMIT_MAX_REQUESTS - rateLimitData.count).toString());
  response.headers.set('X-RateLimit-Reset', rateLimitData.resetTime.toString());
  
  return { allowed: true, headers: Object.fromEntries(response.headers.entries()) };
}