import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// GET /api/referrals/stats - Get comprehensive referral statistics
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

    // Get direct referrals (users referred by this user)
    const directReferrals = await prisma.user.findMany({
      where: {
        referredBy: dbUser.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        packagePurchases: {
          where: {
            status: 'SUCCESS'
          },
          include: {
            package: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get indirect referrals (users referred by direct referrals)
    const indirectReferrals = await prisma.user.findMany({
      where: {
        referredBy: {
          in: directReferrals.map(ref => ref.id)
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        referredBy: true,
        packagePurchases: {
          where: {
            status: 'SUCCESS'
          },
          include: {
            package: {
              select: {
                name: true,
                price: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get commission statistics
    const commissions = await prisma.commission.findMany({
      where: {
        userId: dbUser.id
      },
      include: {
        packagePurchase: {
          include: {
            package: {
              select: {
                name: true
              }
            },
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics
    const totalDirectCommissions = commissions
      .filter(c => c.type === 'DIRECT')
      .reduce((sum, c) => sum + c.amount, 0);

    const totalIndirectCommissions = commissions
      .filter(c => c.type === 'INDIRECT')
      .reduce((sum, c) => sum + c.amount, 0);

    const pendingCommissions = commissions
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + c.amount, 0);

    const paidCommissions = commissions
      .filter(c => c.status === 'PAID')
      .reduce((sum, c) => sum + c.amount, 0);

    // Package purchase statistics
    const packageStats = {
      silver: directReferrals.filter(ref => 
        ref.packagePurchases.some(p => p.package.name === 'Silver Package')
      ).length,
      gold: directReferrals.filter(ref => 
        ref.packagePurchases.some(p => p.package.name === 'Gold Package')
      ).length,
      platinum: directReferrals.filter(ref => 
        ref.packagePurchases.some(p => p.package.name === 'Platinum Package')
      ).length
    };

    // Recent activity
    const recentActivity = [
      ...directReferrals.slice(0, 5).map(ref => ({
        type: 'referral',
        description: `${ref.name || ref.email} joined as your direct referral`,
        date: ref.createdAt,
        amount: null
      })),
      ...commissions.slice(0, 5).map(comm => ({
        type: 'commission',
        description: `Earned ₹${comm.amount} ${comm.type.toLowerCase()} commission from ${comm.packagePurchase?.user.name || 'user'}`,
        date: comm.createdAt,
        amount: comm.amount
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalDirectReferrals: directReferrals.length,
          totalIndirectReferrals: indirectReferrals.length,
          totalCommissions: totalDirectCommissions + totalIndirectCommissions,
          pendingCommissions,
          paidCommissions,
          referralCode: dbUser.referralCode
        },
        commissionBreakdown: {
          directCommissions: totalDirectCommissions,
          indirectCommissions: totalIndirectCommissions,
          totalEarnings: totalDirectCommissions + totalIndirectCommissions
        },
        packageStats,
        directReferrals: directReferrals.map(ref => ({
          id: ref.id,
          name: ref.name,
          email: ref.email,
          joinedAt: ref.createdAt,
          packagesPurchased: ref.packagePurchases.length,
          totalSpent: ref.packagePurchases.reduce((sum, p) => sum + p.package.price, 0)
        })),
        indirectReferrals: indirectReferrals.map(ref => ({
          id: ref.id,
          name: ref.name,
          email: ref.email,
          joinedAt: ref.createdAt,
          referredBy: ref.referredBy,
          packagesPurchased: ref.packagePurchases.length,
          totalSpent: ref.packagePurchases.reduce((sum, p) => sum + p.package.price, 0)
        })),
        recentCommissions: commissions.slice(0, 10).map(comm => ({
          id: comm.id,
          amount: comm.amount,
          type: comm.type,
          level: comm.level,
          status: comm.status,
          createdAt: comm.createdAt,
          packageName: comm.packagePurchase?.package.name,
          fromUser: comm.packagePurchase?.user.name || comm.packagePurchase?.user.email
        })),
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch referral statistics'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}