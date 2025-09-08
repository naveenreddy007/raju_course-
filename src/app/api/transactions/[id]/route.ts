import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const user = session.user

    const transactionId = params.id

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: user.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get transaction details
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId: dbUser.id
      },
      include: {
        user: {
          include: {
            affiliate: true
          }
        },
        commissions: {
          include: {
            affiliate: true
          }
        }
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if this purchase created affiliate relationship
    const hasReferrer = transaction.metadata && 
      typeof transaction.metadata === 'object' && 
      'referralCode' in transaction.metadata &&
      transaction.metadata.referralCode

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        description: transaction.description,
        createdAt: transaction.createdAt,
        packageType: transaction.metadata?.packageType
      },
      affiliate: transaction.user.affiliate ? {
        referralCode: transaction.user.affiliate.referralCode,
        packageType: transaction.user.affiliate.packageType
      } : null,
      hasReferrer: !!hasReferrer,
      commissions: transaction.commissions.map(comm => ({
        id: comm.id,
        amount: comm.amount,
        level: comm.level,
        commissionType: comm.commissionType
      }))
    })

  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction details' },
      { status: 500 }
    )
  }
}