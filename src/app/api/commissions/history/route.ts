import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// GET /api/commissions/history - Get user's commission history
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      );
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id }
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // 'DIRECT', 'INDIRECT', or null for all
    const status = searchParams.get('status'); // 'PENDING', 'PAID', or null for all
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const whereClause: any = {
      userId: dbUser.id
    };

    if (type && ['DIRECT', 'INDIRECT'].includes(type)) {
      whereClause.type = type;
    }

    if (status && ['PENDING', 'PAID'].includes(status)) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.commission.count({
      where: whereClause
    });

    // Get commissions with pagination
    const commissions = await prisma.commission.findMany({
      where: whereClause,
      include: {
        packagePurchase: {
          include: {
            package: {
              select: {
                name: true,
                price: true
              }
            },
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        sourceUser: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Calculate summary statistics
    const summary = await prisma.commission.aggregate({
      where: { userId: dbUser.id },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    const pendingSummary = await prisma.commission.aggregate({
      where: { 
        userId: dbUser.id,
        status: 'PENDING'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    const paidSummary = await prisma.commission.aggregate({
      where: { 
        userId: dbUser.id,
        status: 'PAID'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    const directSummary = await prisma.commission.aggregate({
      where: { 
        userId: dbUser.id,
        type: 'DIRECT'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    const indirectSummary = await prisma.commission.aggregate({
      where: { 
        userId: dbUser.id,
        type: 'INDIRECT'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Format commission data
    const formattedCommissions = commissions.map(commission => ({
      id: commission.id,
      amount: commission.amount,
      type: commission.type,
      level: commission.level,
      status: commission.status,
      createdAt: commission.createdAt,
      updatedAt: commission.updatedAt,
      package: {
        name: commission.packagePurchase?.package.name,
        price: commission.packagePurchase?.package.price
      },
      purchaser: {
        name: commission.packagePurchase?.user.name,
        email: commission.packagePurchase?.user.email
      },
      sourceUser: commission.sourceUser ? {
        name: commission.sourceUser.name,
        email: commission.sourceUser.email
      } : null,
      description: generateCommissionDescription(commission)
    }));

    return NextResponse.json({
      success: true,
      data: {
        commissions: formattedCommissions,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page * limit < totalCount,
          hasPrev: page > 1
        },
        summary: {
          totalEarnings: summary._sum.amount || 0,
          totalCommissions: summary._count.id || 0,
          pendingAmount: pendingSummary._sum.amount || 0,
          pendingCount: pendingSummary._count.id || 0,
          paidAmount: paidSummary._sum.amount || 0,
          paidCount: paidSummary._count.id || 0,
          directEarnings: directSummary._sum.amount || 0,
          directCount: directSummary._count.id || 0,
          indirectEarnings: indirectSummary._sum.amount || 0,
          indirectCount: indirectSummary._count.id || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching commission history:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch commission history'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to generate commission description
function generateCommissionDescription(commission: any): string {
  const packageName = commission.packagePurchase?.package.name || 'Package';
  const purchaserName = commission.packagePurchase?.user.name || commission.packagePurchase?.user.email || 'User';
  const commissionType = commission.type.toLowerCase();
  
  if (commission.type === 'DIRECT') {
    return `Direct commission from ${purchaserName}'s ${packageName} purchase`;
  } else if (commission.type === 'INDIRECT') {
    return `Indirect commission from ${purchaserName}'s ${packageName} purchase (Level ${commission.level})`;
  } else {
    return `${commissionType} commission from ${packageName} purchase`;
  }
}