import { NextRequest, NextResponse } from 'next/server'
import { processAffiliateCommission } from '@/lib/commission'

export async function POST(request: NextRequest) {
  try {
    const { affiliateId, transactionId } = await request.json()

    if (!affiliateId || !transactionId) {
      return NextResponse.json(
        { error: 'Affiliate ID and Transaction ID are required' },
        { status: 400 }
      )
    }

    const result = await processAffiliateCommission(affiliateId, transactionId)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing commission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}