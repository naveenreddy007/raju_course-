import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

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

    const { 
      bankName, 
      accountNumber, 
      ifscCode, 
      accountHolderName,
      isDefault = false 
    } = await request.json()

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: session.user.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validation
    if (!bankName || !accountNumber || !ifscCode || !accountHolderName) {
      return NextResponse.json(
        { error: 'All bank details are required' },
        { status: 400 }
      )
    }

    // Validate IFSC code format
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    if (!ifscRegex.test(ifscCode)) {
      return NextResponse.json(
        { error: 'Invalid IFSC code format' },
        { status: 400 }
      )
    }

    // Check if account number already exists
    const existingAccount = await prisma.bankDetail.findFirst({
      where: {
        accountNumber,
        userId: dbUser.id
      }
    })

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Bank account already exists' },
        { status: 400 }
      )
    }

    // Create bank details
    const result = await prisma.$transaction(async (tx) => {
      // If this is set as default, remove default from other accounts
      if (isDefault) {
        await tx.bankDetail.updateMany({
          where: { userId: dbUser.id },
          data: { isDefault: false }
        })
      }

      // Check if this is the first bank account (auto-default)
      const existingCount = await tx.bankDetail.count({
        where: { userId: dbUser.id }
      })

      const bankDetail = await tx.bankDetail.create({
        data: {
          userId: dbUser.id,
          bankName,
          accountNumber,
          ifscCode: ifscCode.toUpperCase(),
          accountHolderName,
          isDefault: isDefault || existingCount === 0, // First account is automatically default
          isVerified: false // Admin needs to verify
        }
      })

      return bankDetail
    })

    return NextResponse.json({
      success: true,
      message: 'Bank details added successfully',
      data: {
        id: result.id,
        bankName: result.bankName,
        accountNumber: result.accountNumber,
        ifscCode: result.ifscCode,
        accountHolderName: result.accountHolderName,
        isDefault: result.isDefault,
        isVerified: result.isVerified
      }
    })

  } catch (error) {
    console.error('Error adding bank details:', error)
    return NextResponse.json(
      { error: 'Failed to add bank details' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { supabaseId: session.user.id }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get bank details for the user
    const bankDetails = await prisma.bankDetail.findMany({
      where: { userId: dbUser.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: bankDetails
    })

  } catch (error) {
    console.error('Error fetching bank details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bank details' },
      { status: 500 }
    )
  }
}