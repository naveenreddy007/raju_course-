import { NextRequest, NextResponse } from 'next/server'
import { getCommissionStats } from '@/lib/commission'

export async function GET(
  request: NextRequest,
  { params }: { params: { affiliateId: string } }
) {
  try {
    const { affiliateId } = params

    if (!affiliateId) {
      return NextResponse.json(
        { error: 'Affiliate ID is required' },
        { status: 400 }
      )
    }

    const result = await getCommissionStats(affiliateId)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json(result.stats)
  } catch (error) {
    console.error('Error getting commission stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}