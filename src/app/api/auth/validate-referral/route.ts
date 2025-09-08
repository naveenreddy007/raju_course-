import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json()

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Invalid referral code format' },
        { status: 400 }
      )
    }

    // Check if referral code exists and affiliate is active
    const affiliate = await prisma.affiliate.findUnique({
      where: { 
        referralCode: referralCode.trim().toUpperCase() 
      },
      include: {
        user: {
          select: {
            name: true,
            isActive: true
          }
        }
      }
    })

    if (!affiliate || !affiliate.user.isActive || !affiliate.isActive) {
      return NextResponse.json({
        valid: false,
        error: 'Referral code not found or inactive'
      })
    }

    return NextResponse.json({
      valid: true,
      referrerName: affiliate.user.name,
      message: `Valid referral code from ${affiliate.user.name}`
    })

  } catch (error) {
    console.error('Error validating referral code:', error)
    return NextResponse.json(
      { valid: false, error: 'Failed to validate referral code' },
      { status: 500 }
    )
  }
}