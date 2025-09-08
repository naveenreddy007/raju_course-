import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyRazorpaySignature } from '@/lib/razorpay'
import { prisma } from '@/lib/prisma'
import { PackageType, TransactionType, TransactionStatus } from '@/types'
import { generateReferralCode, calculateCommission } from '@/lib/utils'

export async function POST(request: NextRequest) {
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

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      packageType,
      amount,
      referralCode
    } = await request.json()

    // Verify payment signature
    const isValidSignature = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    )

    if (!isValidSignature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Start database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get or create user in our database
      let dbUser = await tx.user.findUnique({
        where: { supabaseId: user.id },
        include: { affiliate: true }
      })

      if (!dbUser) {
        return NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        )
      }

      // Check if user already has an affiliate account
      if (dbUser.affiliate) {
        return NextResponse.json(
          { error: 'User already has a package' },
          { status: 400 }
        )
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: dbUser.id,
          amount: amount / 100, // Convert from paise to rupees
          type: TransactionType.COURSE_PURCHASE,
          status: TransactionStatus.SUCCESS,
          paymentId: razorpay_payment_id,
          paymentMethod: 'razorpay',
          gatewayResponse: {
            order_id: razorpay_order_id,
            payment_id: razorpay_payment_id,
            signature: razorpay_signature
          },
          description: `${packageType} package purchase`,
          metadata: {
            packageType,
            referralCode: referralCode || null
          }
        }
      })

      // Find parent affiliate from the provided referral code or stored user data
      let parentAffiliate = null
      let effectiveReferralCode = referralCode
      
      // If no referral code provided in payment, check if user has stored referral data
      if (!effectiveReferralCode && dbUser.kycDocuments && 
          typeof dbUser.kycDocuments === 'object' && 
          'temporaryReferralData' in dbUser.kycDocuments) {
        const tempData = dbUser.kycDocuments.temporaryReferralData as any
        effectiveReferralCode = tempData.referralCode
      }
      
      if (effectiveReferralCode) {
        parentAffiliate = await tx.affiliate.findUnique({
          where: { referralCode: effectiveReferralCode }
        })
      }

      // Create affiliate account for user
      const affiliate = await tx.affiliate.create({
        data: {
          userId: dbUser.id,
          referralCode: generateReferralCode(dbUser.name),
          parentId: parentAffiliate?.id || null,
          packageType: packageType as PackageType,
          packagePrice: amount / 100,
          purchaseDate: new Date()
        }
      })
      
      // Clear temporary referral data from user record
      if (dbUser.kycDocuments && 
          typeof dbUser.kycDocuments === 'object' && 
          'temporaryReferralData' in dbUser.kycDocuments) {
        await tx.user.update({
          where: { id: dbUser.id },
          data: {
            kycDocuments: null // Clear the temporary data
          }
        })
      }

      // Create referral record if there's a parent
      if (parentAffiliate) {
        await tx.referral.create({
          data: {
            affiliateId: parentAffiliate.id,
            referredUserId: dbUser.id
          }
        })

        // Calculate and create commissions
        // Direct commission for immediate parent
        const directCommission = calculateCommission(
          parentAffiliate.packageType as PackageType,
          packageType as PackageType,
          1
        )

        if (directCommission > 0) {
          await tx.commission.create({
            data: {
              amount: directCommission,
              commissionType: 'DIRECT_REFERRAL',
              level: 1,
              affiliateId: parentAffiliate.id,
              transactionId: transaction.id,
              status: 'APPROVED'
            }
          })

          // Update parent's earnings
          await tx.affiliate.update({
            where: { id: parentAffiliate.id },
            data: {
              totalDirectEarnings: {
                increment: directCommission
              },
              currentBalance: {
                increment: directCommission
              }
            }
          })
        }

        // Check for grandparent (indirect commission)
        if (parentAffiliate.parentId) {
          const grandparentAffiliate = await tx.affiliate.findUnique({
            where: { id: parentAffiliate.parentId }
          })

          if (grandparentAffiliate) {
            const indirectCommission = calculateCommission(
              grandparentAffiliate.packageType as PackageType,
              packageType as PackageType,
              2
            )

            if (indirectCommission > 0) {
              await tx.commission.create({
                data: {
                  amount: indirectCommission,
                  commissionType: 'INDIRECT_REFERRAL',
                  level: 2,
                  affiliateId: grandparentAffiliate.id,
                  fromAffiliateId: parentAffiliate.id,
                  transactionId: transaction.id,
                  status: 'APPROVED'
                }
              })

              // Update grandparent's earnings
              await tx.affiliate.update({
                where: { id: grandparentAffiliate.id },
                data: {
                  totalIndirectEarnings: {
                    increment: indirectCommission
                  },
                  currentBalance: {
                    increment: indirectCommission
                  }
                }
              })
            }
          }
        }
      }

      return {
        transaction,
        affiliate,
        parentAffiliate
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment verified and account created successfully',
      data: {
        transactionId: result.transaction.id,
        affiliateCode: result.affiliate.referralCode,
        hasReferrer: !!result.parentAffiliate
      }
    })

  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}