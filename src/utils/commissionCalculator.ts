import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CommissionCalculation {
  userId: number;
  amount: number;
  type: 'DIRECT' | 'INDIRECT';
  level: number;
  sourceUserId: number;
}

export interface PackageCommissionRates {
  directRate: number;
  indirectRate: number;
}

/**
 * Calculate commissions for a package purchase
 * Implements 2-level commission structure:
 * - Level 1 (Direct): Commission for the direct referrer
 * - Level 2 (Indirect): Commission for the referrer's referrer
 */
export async function calculateCommissions(
  packagePurchaseId: number,
  purchaserUserId: number,
  packagePrice: number,
  commissionRates: PackageCommissionRates
): Promise<CommissionCalculation[]> {
  const commissions: CommissionCalculation[] = [];

  try {
    // Get the purchaser's referral chain
    const purchaser = await prisma.user.findUnique({
      where: { id: purchaserUserId },
      select: {
        id: true,
        referredBy: true
      }
    });

    if (!purchaser || !purchaser.referredBy) {
      // No referrer, no commissions to calculate
      return commissions;
    }

    // Level 1: Direct referrer commission
    const directReferrer = await prisma.user.findUnique({
      where: { id: purchaser.referredBy },
      select: {
        id: true,
        referredBy: true
      }
    });

    if (directReferrer) {
      const directCommissionAmount = Math.round(packagePrice * (commissionRates.directRate / 100));
      
      commissions.push({
        userId: directReferrer.id,
        amount: directCommissionAmount,
        type: 'DIRECT',
        level: 1,
        sourceUserId: purchaserUserId
      });

      // Level 2: Indirect referrer commission (referrer's referrer)
      if (directReferrer.referredBy) {
        const indirectReferrer = await prisma.user.findUnique({
          where: { id: directReferrer.referredBy },
          select: {
            id: true
          }
        });

        if (indirectReferrer) {
          const indirectCommissionAmount = Math.round(packagePrice * (commissionRates.indirectRate / 100));
          
          commissions.push({
            userId: indirectReferrer.id,
            amount: indirectCommissionAmount,
            type: 'INDIRECT',
            level: 2,
            sourceUserId: purchaserUserId
          });
        }
      }
    }

    return commissions;
  } catch (error) {
    console.error('Error calculating commissions:', error);
    throw new Error('Failed to calculate commissions');
  }
}

/**
 * Create commission records in the database
 */
export async function createCommissionRecords(
  commissions: CommissionCalculation[],
  packagePurchaseId: number
): Promise<void> {
  try {
    for (const commission of commissions) {
      await prisma.commission.create({
        data: {
          userId: commission.userId,
          sourceUserId: commission.sourceUserId,
          packagePurchaseId,
          amount: commission.amount,
          type: commission.type,
          level: commission.level,
          status: 'PENDING', // Commissions start as pending
          createdAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error creating commission records:', error);
    throw new Error('Failed to create commission records');
  }
}

/**
 * Get commission rates for a specific package
 */
export function getPackageCommissionRates(packageName: string): PackageCommissionRates {
  const rates: Record<string, PackageCommissionRates> = {
    'Silver Package': {
      directRate: 10, // 10%
      indirectRate: 5  // 5%
    },
    'Gold Package': {
      directRate: 15, // 15%
      indirectRate: 8  // 8%
    },
    'Platinum Package': {
      directRate: 20, // 20%
      indirectRate: 12 // 12%
    }
  };

  return rates[packageName] || {
    directRate: 10,
    indirectRate: 5
  };
}

/**
 * Process commission payment (mark as paid)
 */
export async function processCommissionPayment(
  commissionIds: number[],
  transactionId?: string
): Promise<void> {
  try {
    await prisma.commission.updateMany({
      where: {
        id: {
          in: commissionIds
        },
        status: 'PENDING'
      },
      data: {
        status: 'PAID',
        transactionId,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error processing commission payment:', error);
    throw new Error('Failed to process commission payment');
  }
}

/**
 * Get commission statistics for a user
 */
export async function getUserCommissionStats(userId: number) {
  try {
    const stats = await prisma.commission.groupBy({
      by: ['type', 'status'],
      where: {
        userId
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    const result = {
      totalEarnings: 0,
      pendingEarnings: 0,
      paidEarnings: 0,
      directEarnings: 0,
      indirectEarnings: 0,
      totalCommissions: 0,
      pendingCommissions: 0,
      paidCommissions: 0
    };

    stats.forEach(stat => {
      const amount = stat._sum.amount || 0;
      const count = stat._count.id || 0;

      result.totalEarnings += amount;
      result.totalCommissions += count;

      if (stat.status === 'PENDING') {
        result.pendingEarnings += amount;
        result.pendingCommissions += count;
      } else if (stat.status === 'PAID') {
        result.paidEarnings += amount;
        result.paidCommissions += count;
      }

      if (stat.type === 'DIRECT') {
        result.directEarnings += amount;
      } else if (stat.type === 'INDIRECT') {
        result.indirectEarnings += amount;
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting user commission stats:', error);
    throw new Error('Failed to get commission statistics');
  }
}

/**
 * Validate commission calculation
 */
export function validateCommissionCalculation(
  packagePrice: number,
  commissionRates: PackageCommissionRates
): boolean {
  // Ensure commission rates don't exceed reasonable limits
  const totalRate = commissionRates.directRate + commissionRates.indirectRate;
  
  if (totalRate > 50) { // Max 50% total commission
    return false;
  }
  
  if (commissionRates.directRate < 0 || commissionRates.indirectRate < 0) {
    return false;
  }
  
  if (packagePrice <= 0) {
    return false;
  }
  
  return true;
}

/**
 * Calculate potential earnings for a user based on referral activity
 */
export async function calculatePotentialEarnings(
  userId: number,
  packageName: string
): Promise<{
  directPotential: number;
  indirectPotential: number;
  totalPotential: number;
}> {
  try {
    const rates = getPackageCommissionRates(packageName);
    const packageInfo = await prisma.package.findFirst({
      where: { name: packageName, isActive: true }
    });
    
    if (!packageInfo) {
      throw new Error('Package not found');
    }

    // Get direct referrals count
    const directReferrals = await prisma.user.count({
      where: { referredBy: userId }
    });

    // Get indirect referrals count (referrals of referrals)
    const directReferralIds = await prisma.user.findMany({
      where: { referredBy: userId },
      select: { id: true }
    });

    const indirectReferrals = await prisma.user.count({
      where: {
        referredBy: {
          in: directReferralIds.map(ref => ref.id)
        }
      }
    });

    const directPotential = directReferrals * Math.round(packageInfo.price * (rates.directRate / 100));
    const indirectPotential = indirectReferrals * Math.round(packageInfo.price * (rates.indirectRate / 100));
    const totalPotential = directPotential + indirectPotential;

    return {
      directPotential,
      indirectPotential,
      totalPotential
    };
  } catch (error) {
    console.error('Error calculating potential earnings:', error);
    throw new Error('Failed to calculate potential earnings');
  }
}