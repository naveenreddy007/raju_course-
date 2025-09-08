import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  APIError,
  authenticateUser,
  requireAdmin,
  schemas
} from '@/lib/api-utils';
import { withRateLimit } from '@/middleware/rate-limit';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const createNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'COURSE_UPDATE', 'PAYMENT', 'SYSTEM']),
  userId: z.string().uuid().optional(), // If not provided, creates system-wide notification
  actionUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional()
});

// GET /api/notifications - Get user notifications
export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    // Require authentication
    const user = await authenticateUser(request);
    
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      type: searchParams.get('type'),
      unread_only: searchParams.get('unread_only')
    };
    
    const validatedParams = schemas.pagination.parse({
      page: queryParams.page,
      limit: queryParams.limit
    });
    
    const page = validatedParams.page;
    const limit = Math.min(50, validatedParams.limit);
    const type = queryParams.type;
    const unreadOnly = queryParams.unread_only === 'true';
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      OR: [
        { userId: user.id }, // User-specific notifications
        { userId: null }    // System-wide notifications
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    if (unreadOnly) {
      whereClause.readAt = null;
    }

    // Get notifications with pagination
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: [
          { readAt: 'asc' }, // Unread first
          { createdAt: 'desc' } // Then by newest
        ],
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          actionUrl: true,
          metadata: true,
          readAt: true,
          createdAt: true,
          userId: true
        }
      }),
      prisma.notification.count({ where: whereClause })
    ]);

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        ...whereClause,
        readAt: null
      }
    });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    logger.info(`Notifications retrieved`, {
      userId: user.id,
      page,
      limit,
      totalCount,
      unreadCount,
      type,
      unreadOnly
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPreviousPage,
          limit
        },
        unreadCount
      },
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    if (error instanceof APIError) {
      logger.error('API Error in GET /api/notifications:', error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    logger.error('Unexpected error in GET /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { maxRequests: 100, windowMs: 60000 });

// POST /api/notifications - Create notification (Admin only)
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // Require authentication and admin role
    const user = await authenticateUser(request);
    await requireAdmin(request);

    // Validate request body
    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    // If userId is provided, verify the user exists
    if (validatedData.userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: validatedData.userId },
        select: { id: true, email: true }
      });

      if (!targetUser) {
        throw new APIError('Target user not found', 404);
      }
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title: validatedData.title,
        message: validatedData.message,
        type: validatedData.type,
        userId: validatedData.userId || null, // null for system-wide notifications
        actionUrl: validatedData.actionUrl,
        metadata: validatedData.metadata || {},
        createdAt: new Date()
      },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        userId: true,
        actionUrl: true,
        metadata: true,
        readAt: true,
        createdAt: true
      }
    });

    logger.info(`Notification created`, {
      notificationId: notification.id,
      title: notification.title,
      type: notification.type,
      targetUserId: notification.userId,
      isSystemWide: !notification.userId,
      createdBy: user.id
    });

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    if (error instanceof APIError) {
      logger.error('API Error in POST /api/notifications:', error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    logger.error('Unexpected error in POST /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { maxRequests: 20, windowMs: 60000 });

// PUT /api/notifications/mark-all-read - Mark all notifications as read
export const PUT = withRateLimit(async (request: NextRequest) => {
  try {
    // Require authentication
    const user = await authenticateUser(request);
    const now = new Date();

    // Mark all unread notifications as read for this user
    const result = await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: user.id },
          { userId: null } // System-wide notifications
        ],
        readAt: null
      },
      data: {
        readAt: now
      }
    });

    logger.info(`All notifications marked as read`, {
      userId: user.id,
      updatedCount: result.count
    });

    return NextResponse.json({
      success: true,
      data: { 
        markedAsRead: result.count,
        timestamp: now
      },
      message: `${result.count} notifications marked as read`
    });
  } catch (error) {
    if (error instanceof APIError) {
      logger.error('API Error in PUT /api/notifications:', error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    logger.error('Unexpected error in PUT /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { maxRequests: 30, windowMs: 60000 });