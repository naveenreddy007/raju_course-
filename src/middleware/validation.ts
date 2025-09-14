import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Common validation schemas
export const schemas = {
  // User registration schema (for profile creation after Supabase auth)
  register: z.object({
    supabaseId: z.string().min(1, 'Supabase ID is required'),
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    referralCode: z.string().optional()
  }),
  
  // User login schema
  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  }),
  
  // Course creation schema
  courseCreate: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    category: z.string().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    duration: z.number().min(0).optional(),
    thumbnail: z.string().url().optional().or(z.literal(''))
  }),
  
  // Payment schema
  payment: z.object({
    packageType: z.enum(['SILVER', 'GOLD', 'PLATINUM']),
    referralCode: z.string().optional()
  }),
  
  // KYC schema
  kyc: z.object({
    panCard: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN card format'),
    aadharCard: z.string().optional()
  })
};

// Route-specific validation configurations
const routeValidations: Record<string, z.ZodSchema> = {
  '/api/auth/register': schemas.register,
  '/api/auth/login': schemas.login,
  '/api/courses': schemas.courseCreate,
  '/api/payments/create-order': schemas.payment,
  '/api/auth/kyc': schemas.kyc
};

export async function validateRequest(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // Only validate requests that typically have a body
  if (!['POST', 'PUT', 'PATCH'].includes(method)) {
    return null; // Skip validation for GET, DELETE, etc.
  }

  // Find matching validation schema
  const schema = Object.keys(routeValidations).find(route =>
    pathname.startsWith(route)
  );

  if (!schema) {
    return null; // No validation required for this route
  }

  try {
    const body = await request.json();
    const validationSchema = routeValidations[schema];

    // Validate request body
    const validatedData = validationSchema.parse(body);

    // Add validated data to request headers for downstream use
    const response = NextResponse.next();
    response.headers.set('x-validated-data', JSON.stringify(validatedData));

    return null; // No error, continue with the request
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => err.message).join(', ');

      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errorMessages
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
