import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { referralCode, courseId } = await request.json()

    if (!referralCode) {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      )
    }

    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      include: { user: true }
    })

    if (!affiliate) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    // For now, a fixed discount for any valid referral. 
    // In a real scenario, this would be dynamic based on package, course, etc.
    const discountPercentage = 10 // 10% discount

    return NextResponse.json({
      success: true,
      discountPercentage,
      message: 'Referral code applied successfully'
    })

  } catch (error) {
    console.error('Error applying referral code:', error)
    return NextResponse.json(
      { error: 'Failed to apply referral code' },
      { status: 500 }
    )
  }
}