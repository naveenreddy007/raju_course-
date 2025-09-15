import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils-simple'
import { prisma } from '@/lib/prisma'
import { WithdrawalStatus } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build filter
    const where: any = {}
    if (status && Object.values(WithdrawalStatus).includes(status as WithdrawalStatus)) {
      where.status = status
    }

    // Get withdrawal requests with pagination
    const [withdrawalRequests, totalCount] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        include: {
          user: {
            include: {
              affiliate: true
            }
          },
          bankDetail: true,
          processedBy: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.withdrawalRequest.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: withdrawalRequests,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching withdrawal requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    )
  }
}