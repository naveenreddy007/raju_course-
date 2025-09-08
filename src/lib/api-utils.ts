import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { logger, getRequestContext, logApiRequest, LogCategory } from './logger';

// Re-export logger for convenience
export { logger };
import { applyRateLimit } from '../middleware/rate-limit';

// Custom API Error class
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Request validation schemas
export const schemas = {
  pagination: z.object({
    page: z.string().optional().transform(val => parseInt(val || '1')),
    limit: z.string().optional().transform(val => {
      const num = parseInt(val || '10');
      return Math.min(Math.max(num, 1), 100); // Limit between 1-100
    })
  }),
  
  courseCreate: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    category: z.string().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    duration: z.number().min(0).optional(),
    thumbnail: z.string().url().optional().or(z.literal(''))
  }),
  
  courseCreateSchema: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    category: z.string().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    duration: z.number().min(0).optional(),
    thumbnail: z.string().url().optional().or(z.literal(''))
  }),
  
  moduleCreate: z.object({
    courseId: z.string().uuid('Invalid course ID'),
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().optional(),
    content: z.string().min(1, 'Content is required'),
    videoUrl: z.string().url().optional().or(z.literal('')),
    duration: z.number().min(0).optional(),
    order: z.number().min(0).optional()
  }),
  
  blogPostCreate: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().max(500, 'Excerpt too long').optional(),
    category: z.string().max(50, 'Category too long').optional(),
    tags: z.array(z.string()).optional(),
    featuredImage: z.string().url().optional().or(z.literal('')),
    published: z.boolean().optional(),
    metaTitle: z.string().max(60, 'Meta title too long').optional(),
    metaDescription: z.string().max(160, 'Meta description too long').optional()
  }),
  
  notificationCreate: z.object({
    userId: z.string().uuid().optional(),
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
    type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).optional(),
    metadata: z.record(z.any()).optional()
  })
};

// Authentication helper
export async function authenticateUser(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new APIError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { supabaseId: session.user.id }
    });

    if (!user) {
      throw new APIError('User not found', 404, 'USER_NOT_FOUND');
    }

    return { user, session };
  } catch (error) {
    if (error instanceof APIError) throw error;
    logger.error('Authentication error:', error);
    throw new APIError('Authentication failed', 401, 'AUTH_FAILED');
  }
}

// Admin authorization helper
export async function requireAdmin(request: NextRequest) {
  const { user } = await authenticateUser(request);
  
  if (user.role !== 'ADMIN') {
    throw new APIError('Admin access required', 403, 'FORBIDDEN');
  }
  
  return user;
}

// Request body validation helper
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new APIError(`Validation error: ${errorMessages}`, 400, 'VALIDATION_ERROR');
    }
    throw new APIError('Invalid request body', 400, 'INVALID_BODY');
  }
}

// Query parameters validation helper
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): T {
  try {
    const params = Object.fromEntries(searchParams.entries());
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      throw new APIError(`Query validation error: ${errorMessages}`, 400, 'QUERY_VALIDATION_ERROR');
    }
    throw new APIError('Invalid query parameters', 400, 'INVALID_QUERY');
  }
}

// Enhanced error handler wrapper with rate limiting and logging
export function withErrorHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options?: {
    skipRateLimit?: boolean;
    category?: LogCategory;
    requireAuth?: boolean;
  }
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestContext = getRequestContext(request);
    let userId: string | undefined;
    
    try {
      // Apply rate limiting unless skipped
      if (!options?.skipRateLimit) {
        const rateLimitResult = applyRateLimit(request);
        if (!rateLimitResult.allowed) {
          logger.securityEvent('rate_limit_exceeded', {
            ...requestContext,
            data: { endpoint: requestContext.endpoint }
          });
          
          logApiRequest(request, 429, startTime, { requestId: requestContext.requestId });
          return rateLimitResult.response!;
        }
      }
      
      // Execute the handler
      const response = await handler(request, ...args);
      
      // Extract user ID from response if available (for logging)
      try {
        const responseData = await response.clone().json();
        if (responseData?.data?.user?.id) {
          userId = responseData.data.user.id;
        }
      } catch {
        // Ignore JSON parsing errors for non-JSON responses
      }
      
      // Log successful request
      logApiRequest(request, response.status, startTime, {
        requestId: requestContext.requestId,
        userId
      });
      
      return response;
      
    } catch (error) {
      const errorContext = {
        category: options?.category || LogCategory.API,
        ...requestContext,
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
      
      logger.error('API Error occurred', errorContext, { error: error as Error });
      
      let statusCode = 500;
      let errorResponse: NextResponse;
      
      if (error instanceof APIError) {
        statusCode = error.statusCode;
        errorResponse = NextResponse.json(
          {
            success: false,
            error: error.message,
            code: error.code,
            requestId: requestContext.requestId,
            timestamp: new Date().toISOString()
          },
          { status: error.statusCode }
        );
      } else if (error instanceof z.ZodError) {
        statusCode = 400;
        errorResponse = NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code
            })),
            requestId: requestContext.requestId,
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        );
      } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        let message = 'Database error';
        statusCode = 500;
        
        switch (error.code) {
          case 'P2002':
            message = 'A record with this information already exists';
            statusCode = 409;
            break;
          case 'P2025':
            message = 'Record not found';
            statusCode = 404;
            break;
          case 'P2003':
            message = 'Invalid reference to related record';
            statusCode = 400;
            break;
          case 'P2021':
            message = 'Table does not exist';
            statusCode = 500;
            break;
          case 'P2024':
            message = 'Connection timeout';
            statusCode = 503;
            break;
        }
        
        logger.databaseEvent('error', 'unknown', {
          error: error as Error,
          userId,
          data: { code: error.code, meta: error.meta }
        });
        
        errorResponse = NextResponse.json(
          {
            success: false,
            error: message,
            requestId: requestContext.requestId,
            timestamp: new Date().toISOString()
          },
          { status: statusCode }
        );
      } else {
        // Generic error
        statusCode = 500;
        errorResponse = NextResponse.json(
          {
            success: false,
            error: process.env.NODE_ENV === 'development' 
              ? (error instanceof Error ? error.message : 'Unknown error')
              : 'Internal server error',
            requestId: requestContext.requestId,
            timestamp: new Date().toISOString()
          },
          { status: 500 }
        );
      }
      
      // Log the API request with error status
      logApiRequest(request, statusCode, startTime, {
        requestId: requestContext.requestId,
        userId,
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      
      return errorResponse;
    }
  };
}

// Success response helper
export function successResponse(
  data: any,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// Alternative success response helper (for consistency)
export function createSuccessResponse(
  data: any,
  status: number = 200,
  message?: string
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// Error response helper
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// Alternative authentication helper (for consistency)
export async function getAuthenticatedUser(request: NextRequest) {
  return await authenticateUser(request);
}

// Alias for authenticateUser (for consistency)
export async function requireAuth(request: NextRequest) {
  return await authenticateUser(request);
}

// API Error handler (for consistency)
export function handleAPIError(error: any): NextResponse {
  if (error instanceof APIError) {
    return createErrorResponse(error.message, error.statusCode);
  }
  
  if (error instanceof z.ZodError) {
    const errorMessages = error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');
    return createErrorResponse(`Validation error: ${errorMessages}`, 400);
  }
  
  logger.error('Unhandled API error:', error);
  return createErrorResponse('Internal server error', 500);
}

// Slug generation helper
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Pagination helper
export function createPaginationResponse(
  items: any[],
  total: number,
  page: number,
  limit: number
) {
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}

// Rate limiting helper (delegates to middleware)
export function checkRateLimit(
  request: NextRequest,
  maxRequests?: number,
  windowMs?: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const result = applyRateLimit(request);
  
  if (!result.allowed) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + (windowMs || 15 * 60 * 1000)
    };
  }
  
  const remaining = parseInt(result.headers['X-RateLimit-Remaining'] || '0');
  const resetTime = new Date(result.headers['X-RateLimit-Reset'] || Date.now()).getTime();
  
  return {
    allowed: true,
    remaining,
    resetTime
  };
}

// Export individual schemas for convenience
export const courseCreateSchema = schemas.courseCreate;
export const paginationSchema = schemas.pagination;