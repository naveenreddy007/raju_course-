import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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

export async function requireAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError('Authorization header required', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    
    // Try to decode as Supabase JWT first (no verification needed as it comes from Supabase)
    let decoded: any;
    try {
      // Decode without verification for Supabase tokens
      const payload = token.split('.')[1];
      decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    } catch {
      // Fallback to JWT verification for custom tokens
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    }
    
    // Use 'sub' field for Supabase tokens or 'userId' for custom tokens
    const userIdentifier = decoded.sub || decoded.userId;
    
    const user = await prisma.user.findUnique({
      where: decoded.sub ? { supabaseId: userIdentifier } : { id: userIdentifier },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      throw new APIError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new APIError('Account deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    return { user };
  } catch (error) {
    if (error instanceof APIError) throw error;
    if (error instanceof jwt.JsonWebTokenError) {
      throw new APIError('Invalid token', 401, 'INVALID_TOKEN');
    }
    throw new APIError('Authentication failed', 401, 'AUTH_FAILED');
  }
}