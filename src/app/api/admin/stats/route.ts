import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils-simple'
import { prisma } from '@/lib/prisma'
import { KYCStatus, WithdrawalStatus } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    // Get all stats in parallel
    const [
      totalUsers,
      activeUsers,
      pendingKyc,
      approvedKyc,
      totalRevenue,
      totalCommissions,
      pendingWithdrawals,
      totalCourses
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Pending KYC
      prisma.user.count({
        where: {
          kycStatus: KYCStatus.PENDING
        }
      }),
      
      // Approved KYC
      prisma.user.count({
        where: {
          kycStatus: KYCStatus.APPROVED
        }
      }),
      
      // Total revenue from transactions
      prisma.transaction.aggregate({
        where: {
          status: 'SUCCESS',
          type: 'COURSE_PURCHASE'
        },
        _sum: {
          amount: true
        }
      }),
      
      // Total commissions paid
      prisma.commission.aggregate({
        where: {
          status: 'PAID'
        },
        _sum: {
          amount: true
        }
      }),
      
      // Pending withdrawals
      prisma.withdrawalRequest.count({
        where: {
          status: WithdrawalStatus.PENDING
        }
      }),
      
      // Total courses
      prisma.course.count({
        where: {
          isActive: true
        }
      })
    ])

    const stats = {
      totalUsers,
      activeUsers,
      pendingKyc,
      approvedKyc,
      totalRevenue: totalRevenue._sum.amount || 0,
      totalCommissions: totalCommissions._sum.amount || 0,
      pendingWithdrawals,
      totalCourses
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    )
  }
}