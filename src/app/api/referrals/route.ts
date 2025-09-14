import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-utils-simple'

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)

    // Get user's affiliate data
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: user.id },
      include: {
        referrals: {
          include: {
            referredUser: {
              select: {
                name: true,
                email: true,
                createdAt: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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
        error: 'Affiliate account not found'
      }, { status: 404 })
    }

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const referralLink = `${baseUrl}/register?ref=${affiliate.referralCode}`

    return NextResponse.json({
      success: true,
      data: {
        referralCode: affiliate.referralCode,
        referralLink,
        stats: {
          totalReferrals: affiliate._count.referrals,
          directReferrals: affiliate._count.children,
          totalDirectEarnings: affiliate.totalDirectEarnings,
          totalIndirectEarnings: affiliate.totalIndirectEarnings,
          currentBalance: affiliate.currentBalance,
          commissionRate: affiliate.commissionRate
        },
        recentReferrals: affiliate.referrals.slice(0, 10).map(referral => ({
          id: referral.id,
          userName: referral.referredUser.name,
          userEmail: referral.referredUser.email,
          joinedAt: referral.createdAt,
          commissionEarned: referral.commissionEarned,
          status: referral.status
        }))
      }
    })
  } catch (error) {
    console.error('Referral API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch referral data'
    }, { status: 500 })
  }
}

// Generate referral link for sharing
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request)
    const { platform } = await request.json()

    // Get user's affiliate data
    const affiliate = await prisma.affiliate.findUnique({
      where: { userId: user.id }
    })

    if (!affiliate) {
      return NextResponse.json({
        success: false,
        error: 'Affiliate account not found'
      }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const referralLink = `${baseUrl}/register?ref=${affiliate.referralCode}`
    
    // Generate platform-specific sharing links
    const sharingLinks = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Join our affiliate learning platform and start earning! Use my referral link: ${referralLink}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join our affiliate learning platform!')}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join our affiliate learning platform!')}`
    }

    return NextResponse.json({
      success: true,
      data: {
        referralLink,
        sharingLink: platform ? sharingLinks[platform as keyof typeof sharingLinks] : null,
        allSharingLinks: sharingLinks
      }
    })
  } catch (error) {
    console.error('Referral sharing API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate sharing link'
    }, { status: 500 })
  }
}