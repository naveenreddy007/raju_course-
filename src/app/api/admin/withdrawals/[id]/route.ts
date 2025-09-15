import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils-simple'
import { prisma } from '@/lib/prisma'
import { WithdrawalStatus, TransactionType, TransactionStatus } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request);

    const { status, adminNotes, paymentDetails } = await request.json()
    const withdrawalId = params.id

    // Validate status
    if (!Object.values(WithdrawalStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid withdrawal status' },
        { status: 400 }
      )
    }

    // Get the withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      include: {
        user: {
          include: {
            affiliate: true
          }
        },
        bankDetail: true
      }
    })

    if (!withdrawalRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    // Check if already processed
    if (withdrawalRequest.status !== WithdrawalStatus.PENDING) {
      return NextResponse.json(
        { error: 'Withdrawal request already processed' },
        { status: 400 }
      )
    }

    // Process the withdrawal request
    const result = await prisma.$transaction(async (tx) => {
      // Update withdrawal request
      const updatedRequest = await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status,
          adminNotes,
          processedById: user.id,
          processedAt: new Date()
        }
      })

      let transaction = null

      if (status === WithdrawalStatus.APPROVED || status === WithdrawalStatus.COMPLETED) {
        // Deduct amount from affiliate balance
        await tx.affiliate.update({
          where: { id: withdrawalRequest.user.affiliate!.id },
          data: {
            currentBalance: {
              decrement: withdrawalRequest.amount
            },
            totalWithdrawn: {
              increment: withdrawalRequest.amount
            }
          }
        })

        // Create withdrawal transaction record
        transaction = await tx.transaction.create({
          data: {
            userId: withdrawalRequest.userId,
            amount: -withdrawalRequest.amount, // Negative amount for withdrawal
            type: TransactionType.WITHDRAWAL,
            status: status === WithdrawalStatus.COMPLETED 
              ? TransactionStatus.SUCCESS 
              : TransactionStatus.PENDING,
            description: `Withdrawal request ${status.toLowerCase()}`,
            metadata: {
              withdrawalRequestId: withdrawalId,
              bankDetails: withdrawalRequest.bankDetail,
              paymentDetails: paymentDetails || null,
              processedBy: user.name
            }
          }
        })
      }

      return { updatedRequest, transaction }
    })

    return NextResponse.json({
      success: true,
      message: `Withdrawal request ${status.toLowerCase()} successfully`,
      data: {
        withdrawalRequest: result.updatedRequest,
        transaction: result.transaction
      }
    })

  } catch (error) {
    console.error('Error processing withdrawal request:', error)
    return NextResponse.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await requireAuth(request);

    const withdrawalId = params.id

    // Get the withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
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
      }
    })

    if (!withdrawalRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: withdrawalRequest
    })

  } catch (error) {
    console.error('Error fetching withdrawal request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal request' },
      { status: 500 }
    )
  }
}