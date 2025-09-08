import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-utils';

// In-memory rate limit store (in production, use Redis or similar)
interface RateLimitRecord {
  count: number;
  resetTime: number;
  blocked?: boolean;
  blockUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Rate limit configurations for different endpoints
const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - stricter limits
  '/api/auth/login': { maxRequests: 5, windowMs: 15 * 60 * 1000, blockDuration: 30 * 60 * 1000 }, // 5 requests per 15 min, block for 30 min
  '/api/auth/register': { maxRequests: 3, windowMs: 60 * 60 * 1000, blockDuration: 60 * 60 * 1000 }, // 3 requests per hour
  '/api/auth/forgot-password': { maxRequests: 3, windowMs: 60 * 60 * 1000, blockDuration: 60 * 60 * 1000 },
  
  // Course enrollment - moderate limits
  '/api/courses/*/enroll': { maxRequests: 10, windowMs: 60 * 60 * 1000, blockDuration: 30 * 60 * 1000 }, // 10 enrollments per hour
  
  // Content creation - moderate limits for admins
  '/api/courses': { maxRequests: 20, windowMs: 60 * 60 * 1000, blockDuration: 15 * 60 * 1000 },
  '/api/blog': { maxRequests: 15, windowMs: 60 * 60 * 1000, blockDuration: 15 * 60 * 1000 },
  '/api/notifications': { maxRequests: 50, windowMs: 60 * 60 * 1000, blockDuration: 10 * 60 * 1000 },
  
  // General API endpoints
  'default': { maxRequests: 100, windowMs: 15 * 60 * 1000, blockDuration: 5 * 60 * 1000 } // 100 requests per 15 min
};

// Get client identifier (IP + User-Agent for better uniqueness)
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent.substring(0, 50)}`; // Limit user agent length
}

// Get rate limit config for a specific path
function getRateLimitConfig(pathname: string) {
  // Check for exact matches first
  if (RATE_LIMIT_CONFIGS[pathname as keyof typeof RATE_LIMIT_CONFIGS]) {
    return RATE_LIMIT_CONFIGS[pathname as keyof typeof RATE_LIMIT_CONFIGS];
  }
  
  // Check for pattern matches
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIGS)) {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace('*', '[^/]+'));
      if (regex.test(pathname)) {
        return config;
      }
    }
  }
  
  return RATE_LIMIT_CONFIGS.default;
}

// Clean up expired records periodically
function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime && (!record.blockUntil || now > record.blockUntil)) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredRecords, 5 * 60 * 1000);

export function applyRateLimit(
  request: NextRequest,
  pathname?: string
): { allowed: boolean; response?: NextResponse; headers: Record<string, string> } {
  const clientId = getClientIdentifier(request);
  const path = pathname || new URL(request.url).pathname;
  const config = getRateLimitConfig(path);
  const now = Date.now();
  
  const key = `${clientId}:${path}`;
  const record = rateLimitStore.get(key);
  
  // Check if client is currently blocked
  if (record?.blocked && record.blockUntil && now < record.blockUntil) {
    const remainingTime = Math.ceil((record.blockUntil - now) / 1000);
    return {
      allowed: false,
      response: createErrorResponse(
        `Too many requests. Blocked for ${remainingTime} seconds.`,
        429,
        {
          retryAfter: remainingTime,
          blockUntil: new Date(record.blockUntil).toISOString()
        }
      ),
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(record.blockUntil).toISOString(),
        'Retry-After': remainingTime.toString()
      }
    };
  }
  
  // Initialize or reset record if window has passed
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false
    });
    
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': (config.maxRequests - 1).toString(),
        'X-RateLimit-Reset': new Date(now + config.windowMs).toISOString()
      }
    };
  }
  
  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    // Block the client
    record.blocked = true;
    record.blockUntil = now + config.blockDuration;
    
    const remainingTime = Math.ceil(config.blockDuration / 1000);
    return {
      allowed: false,
      response: createErrorResponse(
        `Rate limit exceeded. Blocked for ${remainingTime} seconds.`,
        429,
        {
          retryAfter: remainingTime,
          blockUntil: new Date(record.blockUntil).toISOString()
        }
      ),
      headers: {
        'X-RateLimit-Limit': config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
        'Retry-After': remainingTime.toString()
      }
    };
  }
  
  // Increment counter
  record.count++;
  
  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': (config.maxRequests - record.count).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString()
    }
  };
}

// Middleware wrapper for API routes
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const rateLimitResult = applyRateLimit(request);
    
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    try {
      const response = await handler(request, ...args);
      
      // Add rate limit headers to successful responses
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    } catch (error) {
      // Even on error, we should add rate limit headers
      const errorResponse = error instanceof Error 
        ? createErrorResponse(error.message, 500)
        : createErrorResponse('Internal server error', 500);
      
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        errorResponse.headers.set(key, value);
      });
      
      return errorResponse;
    }
  };
}

// Get current rate limit status for a client
export function getRateLimitStatus(request: NextRequest, pathname?: string) {
  const clientId = getClientIdentifier(request);
  const path = pathname || new URL(request.url).pathname;
  const config = getRateLimitConfig(path);
  const key = `${clientId}:${path}`;
  const record = rateLimitStore.get(key);
  const now = Date.now();
  
  if (!record || now > record.resetTime) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: new Date(now + config.windowMs),
      blocked: false
    };
  }
  
  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    reset: new Date(record.resetTime),
    blocked: record.blocked || false,
    blockUntil: record.blockUntil ? new Date(record.blockUntil) : undefined
  };
}