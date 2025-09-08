import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { 
  handleAPIError, 
  requireAuth,
  createSuccessResponse,
  logger
} from '@/lib/api-utils';

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/notifications/[id] - Get specific notification
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: notificationId } = params;

    // Require authentication
    const { user } = await requireAuth(request);
    const userId = user.id;

    // Get notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
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

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this notification
    const hasAccess = notification.userId === userId || notification.userId === null;
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this notification' },
        { status: 403 }
      );
    }

    logger.info(`Notification retrieved`, {
      notificationId,
      userId,
      isSystemWide: !notification.userId
    });

    return createSuccessResponse(notification, 'Notification retrieved successfully');

  } catch (error) {
    return handleAPIError(error, 'Failed to fetch notification');
  }
}

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: notificationId } = params;

    // Require authentication
    const { user } = await requireAuth(request);
    const userId = user.id;

    // Check if notification exists and user has access
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        userId: true,
        readAt: true,
        title: true
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this notification
    const hasAccess = notification.userId === userId || notification.userId === null;
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this notification' },
        { status: 403 }
      );
    }

    // Check if already read
    if (notification.readAt) {
      return createSuccessResponse(
        { 
          id: notificationId,
          readAt: notification.readAt,
          alreadyRead: true
        }, 
        'Notification was already marked as read'
      );
    }

    // Mark as read
    const now = new Date();
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: now },
      select: {
        id: true,
        title: true,
        readAt: true,
        userId: true
      }
    });

    logger.info(`Notification marked as read`, {
      notificationId,
      userId,
      title: notification.title,
      readAt: now
    });

    return createSuccessResponse(
      {
        id: notificationId,
        readAt: now,
        alreadyRead: false
      }, 
      'Notification marked as read'
    );

  } catch (error) {
    return handleAPIError(error, 'Failed to mark notification as read');
  }
}

// DELETE /api/notifications/[id] - Delete notification (Admin only or own notifications)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: notificationId } = params;

    // Require authentication
    const { user } = await requireAuth(request);
    const userId = user.id;

    // Get user role and notification details
    const [userRole, notification] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      }),
      prisma.notification.findUnique({
        where: { id: notificationId },
        select: {
          id: true,
          userId: true,
          title: true,
          type: true
        }
      })
    ]);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = userRole?.role === 'ADMIN';
    const isOwnNotification = notification.userId === userId;
    const isSystemNotification = notification.userId === null;

    // Users can delete their own notifications, admins can delete any notification
    // System-wide notifications can only be deleted by admins
    if (!isAdmin && (!isOwnNotification || isSystemNotification)) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this notification' },
        { status: 403 }
      );
    }

    // Delete the notification
    await prisma.notification.delete({
      where: { id: notificationId }
    });

    logger.info(`Notification deleted`, {
      notificationId,
      title: notification.title,
      type: notification.type,
      targetUserId: notification.userId,
      deletedBy: userId,
      isAdmin
    });

    return createSuccessResponse(
      { 
        id: notificationId,
        title: notification.title,
        deletedAt: new Date()
      }, 
      'Notification deleted successfully'
    );

  } catch (error) {
    return handleAPIError(error, 'Failed to delete notification');
  }
}