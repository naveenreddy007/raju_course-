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

// PUT /api/notifications/[id]/read - Mark specific notification as read
export const PUT = withRateLimit(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Require authentication
    const user = await authenticateUser(request);
    const notificationId = params.id;

    // Validate notification ID format
    if (!notificationId || typeof notificationId !== 'string') {
      throw new APIError('Invalid notification ID', 400);
    }

    // Check if notification exists and user has access to it
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        OR: [
          { userId: user.id }, // User-specific notification
          { userId: null }    // System-wide notification
        ]
      },
      select: {
        id: true,
        title: true,
        readAt: true,
        userId: true
      }
    });

    if (!notification) {
      throw new APIError('Notification not found or access denied', 404);
    }

    // Check if already read
    if (notification.readAt) {
      return NextResponse.json({
        success: true,
        data: {
          id: notification.id,
          readAt: notification.readAt,
          alreadyRead: true
        },
        message: 'Notification was already marked as read'
      });
    }

    // Mark as read
    const now = new Date();
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: now },
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
    });

    logger.info(`Notification marked as read`, {
      notificationId,
      userId: user.id,
      title: notification.title,
      readAt: now
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedNotification,
        alreadyRead: false
      },
      message: 'Notification marked as read successfully'
    });
  } catch (error) {
    if (error instanceof APIError) {
      logger.error('API Error in PUT /api/notifications/[id]/read:', error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    logger.error('Unexpected error in PUT /api/notifications/[id]/read:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { maxRequests: 50, windowMs: 60000 });

// GET /api/notifications/[id]/read - Get notification read status
export const GET = withRateLimit(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Require authentication
    const user = await authenticateUser(request);
    const notificationId = params.id;

    // Validate notification ID format
    if (!notificationId || typeof notificationId !== 'string') {
      throw new APIError('Invalid notification ID', 400);
    }

    // Get notification read status
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        OR: [
          { userId: user.id }, // User-specific notification
          { userId: null }    // System-wide notification
        ]
      },
      select: {
        id: true,
        title: true,
        readAt: true,
        createdAt: true,
        userId: true
      }
    });

    if (!notification) {
      throw new APIError('Notification not found or access denied', 404);
    }

    const isRead = !!notification.readAt;
    const readStatus = {
      id: notification.id,
      title: notification.title,
      isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      isSystemWide: !notification.userId
    };

    logger.info(`Notification read status retrieved`, {
      notificationId,
      userId: user.id,
      isRead
    });

    return NextResponse.json({
      success: true,
      data: readStatus,
      message: 'Notification read status retrieved successfully'
    });
  } catch (error) {
    if (error instanceof APIError) {
      logger.error('API Error in GET /api/notifications/[id]/read:', error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
    
    logger.error('Unexpected error in GET /api/notifications/[id]/read:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}, { maxRequests: 100, windowMs: 60000 });