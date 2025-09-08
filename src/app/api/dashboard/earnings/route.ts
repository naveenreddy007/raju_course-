import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-utils-simple';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);
    const userId = user.id;

    // Get user's affiliate data
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId }
    });

    if (!affiliate) {
      return NextResponse.json({
        success: true,
        data: {
          totalEarnings: 0,
          pendingEarnings: 0,
          paidEarnings: 0,
          commissions: [],
          referrals: [],
          stats: {
            totalReferrals: 0,
            activeReferrals: 0,
            totalCommissions: 0
          }
        }
      });
    }

    // Get commission data
    const [commissions, referrals] = await Promise.all([
      prisma.commission.findMany({
        where: { affiliateId: affiliate.id },
        include: {
          transaction: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.referral.findMany({
        where: { affiliateId: affiliate.id },
        include: {
          referredUser: {
            select: {
              name: true,
              email: true,
              createdAt: true,
              _count: {
                select: {
                  transactions: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Calculate earnings
    const totalEarnings = commissions.reduce((sum, comm) => sum + comm.amount, 0);
    const pendingEarnings = commissions
      .filter(comm => comm.status === 'PENDING')
      .reduce((sum, comm) => sum + comm.amount, 0);
    const paidEarnings = commissions
      .filter(comm => comm.status === 'PAID')
      .reduce((sum, comm) => sum + comm.amount, 0);

    // Calculate stats
    const stats = {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(ref => 
        ref.referredUser._count.transactions > 0
      ).length,
      totalCommissions: commissions.length
    };

    // Format commission data
    const formattedCommissions = commissions.map(comm => ({
      id: comm.id,
      amount: comm.amount,
      type: comm.type,
      status: comm.status,
      createdAt: comm.createdAt,
      transaction: {
        id: comm.transaction.id,
        amount: comm.transaction.amount,
        description: comm.transaction.description,
        user: comm.transaction.user
      }
    }));

    // Format referral data
    const formattedReferrals = referrals.map(ref => ({
      id: ref.id,
      referredUser: {
        name: ref.referredUser.name,
        email: ref.referredUser.email,
        joinedAt: ref.referredUser.createdAt,
        totalPurchases: ref.referredUser._count.transactions
      },
      createdAt: ref.createdAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        affiliate: {
          referralCode: affiliate.referralCode,
          commissionRate: affiliate.commissionRate,
          totalEarnings: affiliate.totalEarnings
        },
        earnings: {
          totalEarnings,
          pendingEarnings,
          paidEarnings
        },
        commissions: formattedCommissions,
        referrals: formattedReferrals,
        stats
      }
    });

  } catch (error) {
    console.error('Dashboard earnings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    );
  }
}