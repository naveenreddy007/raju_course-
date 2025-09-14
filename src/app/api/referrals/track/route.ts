import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { referralCode, visitorInfo } = await request.json()

    if (!referralCode) {
      return NextResponse.json({
        success: false,
        error: 'Referral code is required'
      }, { status: 400 })
    }

    // Find the affiliate by referral code
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!affiliate) {
      return NextResponse.json({
        success: false,
        error: 'Invalid referral code'
      }, { status: 404 })
    }

    // Track the referral click (you can extend this to store visitor info)
    // For now, we'll just validate the referral code and return affiliate info
    
    return NextResponse.json({
      success: true,
      data: {
        referralCode: affiliate.referralCode,
        referrerName: affiliate.user.name,
        packageType: affiliate.packageType,
        commissionRate: affiliate.commissionRate,
        isValid: true
      }
    })
  } catch (error) {
    console.error('Referral tracking error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to track referral'
    }, { status: 500 })
  }
}

// Get referral statistics for tracking
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const referralCode = searchParams.get('code')

    if (!referralCode) {
      return NextResponse.json({
        success: false,
        error: 'Referral code is required'
      }, { status: 400 })
    }

    // Find the affiliate and get their stats
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode },
      include: {
        user: {
          select: {
            name: true,
            avatar: true
          }
        },
        _count: {
          select: {
            referrals: true,
            children: true
          }
        }
      }
    })

    if (!affiliate) {
      return NextResponse.json({
        success: false,
        error: 'Invalid referral code'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        referrerName: affiliate.user.name,
        referrerAvatar: affiliate.user.avatar,
        packageType: affiliate.packageType,
        totalReferrals: affiliate._count.referrals,
        directReferrals: affiliate._count.children,
        totalEarnings: affiliate.totalDirectEarnings + affiliate.totalIndirectEarnings,
        commissionRate: affiliate.commissionRate
      }
    })
  } catch (error) {
    console.error('Referral stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get referral stats'
    }, { status: 500 })
  }
}