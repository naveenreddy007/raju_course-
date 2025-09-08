import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { 
  APIError,
  authenticateUser
} from '@/lib/api-utils';
import { withRateLimit } from '@/middleware/rate-limit';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validation schema for bulk actions
const bulkActionSchema = z.object({
  action: z.enum(['markAllAsRead', 'markAsRead', 'delete', 'deleteAllRead']),
  notificationIds: z.array(z.string()).optional()
});

// POST /api/notifications/bulk - Bulk actions on notifications
export const POST = withRateLimit(async (request: NextRequest) => {
  try {
    // Require authentication
    const user = await authenticateUser(request);

    // Parse and validate request body
    const body = await request.json();
    const validationResult = bulkActionSchema.safeParse(body);
    
    if (!validationResult.success) {
      throw new APIError(
        `Invalid request data: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
        400
      );
    }

    const { action, notificationIds } = validationResult.data;

    let result;
    let message;

    switch (action) {
      case 'markAllAsRead':
        // Mark all user notifications as read
        result = await prisma.notification.updateMany({
          where: {
            userId: user.id,
            readAt: null // Only update unread notifications
          },
          data: {
            readAt: new Date()
          }
        });
        message = `Marked ${result.count} notifications as read`;
        break;

      case 'markAsRead':
        // Mark specific notifications as read
        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
          throw new APIError('Notification IDs array is required and cannot be empty for this action', 400);
        }

        result = await prisma.notification.updateMany({
          where: {
            id: { in: notificationIds },
            userId: user.id,
            readAt: null // Only update unread notifications
          },
          data: {
            readAt: new Date()
          }
        });
        message = `Marked ${result.count} notifications as read`;
        break;

      case 'delete':
        // Delete specific notifications
        if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
          throw new APIError('Notification IDs array is required and cannot be empty for this action', 400);
        }

        result = await prisma.notification.deleteMany({
          where: {
            id: { in: notificationIds },
            userId: user.id
          }
        });
        message = `Deleted ${result.count} notifications`;
        break;

      case 'deleteAllRead':
        // Delete all read notifications for user
        result = await prisma.notification.deleteMany({
          where: {
            userId: user.id,
            readAt: { not: null } // Only delete read notifications
          }
        });
        message = `Deleted ${result.count} read notifications`;
        break;

      default:
        throw new APIError('Invalid action. Supported actions: markAllAsRead, markAsRead, delete, deleteAllRead', 400);
    }

    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        readAt: null
      }
    });

    logger.info(`Bulk notification action performed`, {
      userId: user.id,
      action,
      affectedCount: result.count,
      notificationIds: notificationIds?.length || 0,
      unreadCount
    });

    return NextResponse.json({
      success: true,
      data: {
        affectedCount: result.count,
        unreadCount,
        action
      },
      message
    });
  } catch (error) {
    if (error instanceof APIError) {
      logger.error('API Error in POST /api/notifications/bulk:', error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    logger.error('Unexpected error in POST /api/notifications/bulk:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { maxRequests: 30, windowMs: 60000 });