import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const {
      supabaseId,
      email,
      name,
      phone,
      referralCode
    } = await request.json()

    if (!supabaseId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields', details: `supabaseId: ${supabaseId ? 'Present' : 'Required'}, email: ${email ? 'Present' : 'Required'}, name: ${name ? 'Present' : 'Required'}` },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    // Validate referral code if provided
    let referredById = null
    if (referralCode) {
      const parentAffiliate = await prisma.affiliate.findUnique({
        where: { referralCode },
        include: { user: true }
      })

      if (!parentAffiliate) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        )
      }

      referredById = parentAffiliate.userId
    }

    // Create user record
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        phone,
        supabaseId: supabaseId, // Use provided Supabase user ID
        emailVerified: false,
        phoneVerified: false,
        isActive: true
      }
    })

    // Create affiliate record for the new user
    const userReferralCode = `USER${user.id.slice(-6).toUpperCase()}`
    const affiliate = await prisma.affiliate.create({
      data: {
        userId: user.id,
        referralCode: userReferralCode,
        commissionRate: 0.10, // 10% default commission
        totalDirectEarnings: 0,
        totalIndirectEarnings: 0,
        totalWithdrawn: 0,
        currentBalance: 0,
        packageType: 'SILVER', // Default package type
        packagePrice: 0, // Will be updated when user purchases a package
        purchaseDate: new Date(),
        isActive: true,
        ...(referredById && { parentId: referredById })
      }
    })

    // Create referral record if referred by someone
    if (referredById) {
      const parentAffiliate = await prisma.affiliate.findUnique({
        where: { userId: referredById }
      })
      
      if (parentAffiliate) {
        await prisma.referral.create({
          data: {
            affiliateId: parentAffiliate.id,
            referredUserId: user.id
          }
        })
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      referralCode: userReferralCode
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      token,
      user: userData,
      hasReferralCode: !!referralCode
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
