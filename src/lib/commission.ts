import { PackageType, CommissionType } from '@/types'
import { prisma } from '@/lib/prisma'

// Commission calculation based on the business model
export function calculateCommission(
  userPackage: PackageType,
  referralPackage: PackageType,
  level: 1 | 2
): number {
  const commissionRates = {
    SILVER: {
      direct: { SILVER: 1875, GOLD: 2375, PLATINUM: 2875 },
      indirect: { SILVER: 150, GOLD: 350, PLATINUM: 400 }
    },
    GOLD: {
      direct: { SILVER: 1875, GOLD: 3375, PLATINUM: 3875 },
      indirect: { SILVER: 200, GOLD: 400, PLATINUM: 600 }
    },
    PLATINUM: {
      direct: { SILVER: 1875, GOLD: 3375, PLATINUM: 5625 },
      indirect: { SILVER: 200, GOLD: 500, PLATINUM: 1000 }
    }
  }

  return level === 1 
    ? commissionRates[userPackage].direct[referralPackage]
    : commissionRates[userPackage].indirect[referralPackage]
}

// Process commission when a new affiliate joins
export async function processAffiliateCommission(
  newAffiliateId: string,
  transactionId: string
) {
  try {
    const newAffiliate = await prisma.affiliate.findUnique({
      where: { id: newAffiliateId },
      include: { user: true }
    })

    if (!newAffiliate || !newAffiliate.parentId) {
      return { success: true, message: 'No parent affiliate found' }
    }

    // Get parent affiliate (Level 1)
    const parentAffiliate = await prisma.affiliate.findUnique({
      where: { id: newAffiliate.parentId },
      include: { user: true, parent: { include: { user: true } } }
    })

    if (!parentAffiliate) {
      return { error: 'Parent affiliate not found' }
    }

    const commissions = []

    // Level 1 Commission (Direct)
    const level1Commission = calculateCommission(
      parentAffiliate.packageType,
      newAffiliate.packageType,
      1
    )

    const level1CommissionRecord = await prisma.commission.create({
      data: {
        amount: level1Commission,
        commissionType: CommissionType.DIRECT_REFERRAL,
        level: 1,
        affiliateId: parentAffiliate.id,
        fromAffiliateId: newAffiliate.id,
        transactionId,
        status: 'PENDING'
      }
    })

    commissions.push(level1CommissionRecord)

    // Update parent affiliate earnings
    await prisma.affiliate.update({
      where: { id: parentAffiliate.id },
      data: {
        totalDirectEarnings: {
          increment: level1Commission
        },
        currentBalance: {
          increment: level1Commission
        }
      }
    })

    // Level 2 Commission (Indirect) - if grandparent exists
    if (parentAffiliate.parent) {
      const level2Commission = calculateCommission(
        parentAffiliate.parent.packageType,
        newAffiliate.packageType,
        2
      )

      const level2CommissionRecord = await prisma.commission.create({
        data: {
          amount: level2Commission,
          commissionType: CommissionType.INDIRECT_REFERRAL,
          level: 2,
          affiliateId: parentAffiliate.parent.id,
          fromAffiliateId: newAffiliate.id,
          transactionId,
          status: 'PENDING'
        }
      })

      commissions.push(level2CommissionRecord)

      // Update grandparent affiliate earnings
      await prisma.affiliate.update({
        where: { id: parentAffiliate.parent.id },
        data: {
          totalIndirectEarnings: {
            increment: level2Commission
          },
          currentBalance: {
            increment: level2Commission
          }
        }
      })
    }

    // Create referral tracking record
    await prisma.referral.create({
      data: {
        affiliateId: parentAffiliate.id,
        referredUserId: newAffiliate.userId,
        commissionEarned: level1Commission
      }
    })

    return { 
      success: true, 
      commissions,
      level1Commission,
      level2Commission: commissions.length > 1 ? commissions[1].amount : 0
    }

  } catch (error) {
    console.error('Error processing affiliate commission:', error)
    return { error: 'Failed to process commission' }
  }
}

// Get affiliate hierarchy (upline and downline)
export async function getAffiliateHierarchy(affiliateId: string) {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId },
      include: {
        user: true,
        parent: {
          include: {
            user: true,
            parent: {
              include: { user: true }
            }
          }
        },
        children: {
          include: {
            user: true,
            children: {
              include: { user: true }
            }
          }
        }
      }
    })

    if (!affiliate) {
      return { error: 'Affiliate not found' }
    }

    return {
      affiliate,
      upline: {
        level1: affiliate.parent,
        level2: affiliate.parent?.parent
      },
      downline: {
        level1: affiliate.children,
        level2: affiliate.children.flatMap(child => child.children)
      }
    }
  } catch (error) {
    console.error('Error getting affiliate hierarchy:', error)
    return { error: 'Failed to get hierarchy' }
  }
}

// Get commission statistics for an affiliate
export async function getCommissionStats(affiliateId: string) {
  try {
    const affiliate = await prisma.affiliate.findUnique({
      where: { id: affiliateId }
    })

    if (!affiliate) {
      return { error: 'Affiliate not found' }
    }

    const [directCommissions, indirectCommissions, totalReferrals] = await Promise.all([
      prisma.commission.findMany({
        where: {
          affiliateId,
          level: 1
        },
        include: {
          fromAffiliate: {
            include: { user: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      prisma.commission.findMany({
        where: {
          affiliateId,
          level: 2
        },
        include: {
          fromAffiliate: {
            include: { user: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      prisma.referral.count({
        where: { affiliateId }
      })
    ])

    const stats = {
      totalDirectEarnings: affiliate.totalDirectEarnings,
      totalIndirectEarnings: affiliate.totalIndirectEarnings,
      totalEarnings: affiliate.totalDirectEarnings + affiliate.totalIndirectEarnings,
      currentBalance: affiliate.currentBalance,
      totalWithdrawn: affiliate.totalWithdrawn,
      totalReferrals,
      directCommissions,
      indirectCommissions
    }

    return { stats }
  } catch (error) {
    console.error('Error getting commission stats:', error)
    return { error: 'Failed to get stats' }
  }
}