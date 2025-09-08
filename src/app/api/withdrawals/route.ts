import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { WithdrawalStatus } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Get session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { amount, bankDetailId } = await request.json()

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: session.user.id },
      include: {
        affiliate: true,
        bankDetails: true
      }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!dbUser.affiliate) {
      return NextResponse.json(
        { error: 'No affiliate account found' },
        { status: 404 }
      )
    }

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      )
    }

    if (amount < 500) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is ₹500' },
        { status: 400 }
      )
    }

    if (amount > dbUser.affiliate.currentBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Validate bank details if provided
    if (bankDetailId) {
      const bankDetail = await prisma.bankDetail.findFirst({
        where: {
          id: bankDetailId,
          userId: dbUser.id,
          isVerified: true
        }
      })

      if (!bankDetail) {
        return NextResponse.json(
          { error: 'Invalid or unverified bank details' },
          { status: 400 }
        )
      }
    }

    // Check for pending withdrawal requests
    const pendingRequest = await prisma.withdrawalRequest.findFirst({
      where: {
        userId: dbUser.id,
        status: {
          in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING]
        }
      }
    })

    if (pendingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending withdrawal request' },
        { status: 400 }
      )
    }

    // Create withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId: dbUser.id,
        amount,
        bankDetailId: bankDetailId || null,
        status: WithdrawalStatus.PENDING
      },
      include: {
        bankDetail: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        id: withdrawalRequest.id,
        amount: withdrawalRequest.amount,
        status: withdrawalRequest.status,
        createdAt: withdrawalRequest.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating withdrawal request:', error)
    return NextResponse.json(
      { error: 'Failed to create withdrawal request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: session.user.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get withdrawal requests for the user
    const withdrawalRequests = await prisma.withdrawalRequest.findMany({
      where: { userId: dbUser.id },
      include: {
        bankDetail: true,
        processedBy: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: withdrawalRequests
    })

  } catch (error) {
    console.error('Error fetching withdrawal requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal requests' },
      { status: 500 }
    )
  }
}