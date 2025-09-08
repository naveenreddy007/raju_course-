import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-utils-simple'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    // Get user data with affiliate information
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        affiliate: {
          include: {
            _count: {
              select: {
                referrals: true
              }
            }
          }
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            course: true
          }
        },
        transactions: {
          where: { status: 'SUCCESS' }
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate real statistics
    const stats = {
      totalEarnings: (dbUser.affiliate?.totalDirectEarnings || 0) + (dbUser.affiliate?.totalIndirectEarnings || 0),
      totalReferrals: dbUser.affiliate?._count?.referrals || 0,
      activeReferrals: dbUser.affiliate?._count?.referrals || 0,
      coursesEnrolled: dbUser.enrollments.length,
      totalSpent: dbUser.transactions.reduce((sum, t) => sum + t.amount, 0),
      memberSince: dbUser.createdAt,
      currentBalance: dbUser.affiliate?.currentBalance || 0
    }

    // Get recent activities (transactions and commissions)
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        description: true,
        createdAt: true
      }
    })

    const recentCommissions = await prisma.commission.findMany({
      where: {
        affiliateId: dbUser.affiliate?.id
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        amount: true,
        commissionType: true,
        level: true,
        status: true,
        createdAt: true,
        fromAffiliate: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })

    // Combine and sort recent activities
    const recentActivities = [
      ...recentTransactions.map((t: any) => ({
        id: t.id,
        type: 'transaction',
        amount: t.amount,
        description: t.description || `${t.type.replace('_', ' ')}`,
        date: t.createdAt,
        status: t.status
      })),
      ...recentCommissions.map((c: any) => ({
        id: c.id,
        type: 'commission',
        amount: c.amount,
        description: `${c.commissionType.replace('_', ' ')} from ${c.fromAffiliate?.user?.name || 'Unknown'}`,
        date: c.createdAt,
        status: c.status,
        level: c.level
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    return NextResponse.json({
      success: true,
      stats,
      recentActivities,
      user: {
        name: dbUser.name,
        email: dbUser.email,
        kycStatus: dbUser.kycStatus,
        affiliateCode: dbUser.affiliate?.referralCode
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}