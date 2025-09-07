import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateReferralCode, packagePricing } from '@/lib/utils'
import { PackageType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { 
      supabaseId, 
      email, 
      name, 
      phone, 
      referralCode, 
      packageType 
    } = await request.json()

    if (!supabaseId || !email || !name || !packageType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { supabaseId }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    // Find parent affiliate if referral code provided
    let parentAffiliate = null
    if (referralCode) {
      parentAffiliate = await prisma.affiliate.findUnique({
        where: { referralCode }
      })
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          supabaseId,
          email,
          name,
          phone,
          emailVerified: false,
          phoneVerified: false
        }
      })

      // Generate unique referral code
      let userReferralCode = generateReferralCode(name)
      let attempts = 0
      while (attempts < 5) {
        const existing = await tx.affiliate.findUnique({
          where: { referralCode: userReferralCode }
        })
        if (!existing) break
        userReferralCode = generateReferralCode(name) + Math.floor(Math.random() * 99)
        attempts++
      }

      // Create affiliate profile
      const affiliate = await tx.affiliate.create({
        data: {
          userId: user.id,
          referralCode: userReferralCode,
          parentId: parentAffiliate?.id,
          packageType: packageType as PackageType,
          packagePrice: packagePricing[packageType as PackageType].final,
          purchaseDate: new Date()
        }
      })

      // Create initial transaction for package purchase
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          amount: packagePricing[packageType as PackageType].final,
          type: 'COURSE_PURCHASE',
          status: 'PENDING',
          description: `${packageType} package purchase`
        }
      })

      return { user, affiliate, transaction }
    })

    return NextResponse.json({
      message: 'User created successfully',
      userId: result.user.id,
      affiliateId: result.affiliate.id,
      transactionId: result.transaction.id
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}