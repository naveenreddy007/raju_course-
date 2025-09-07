import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { panCard, aadharCard, documents } = await request.json()

    if (!panCard) {
      return NextResponse.json(
        { error: 'PAN card is required' },
        { status: 400 }
      )
    }

    // Get current user from Supabase auth
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
    if (!supabaseUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if PAN already exists for another user
    const existingPAN = await prisma.user.findFirst({
      where: {
        panCard,
        NOT: {
          supabaseId: supabaseUser.id
        }
      }
    })

    if (existingPAN) {
      return NextResponse.json(
        { error: 'PAN card already registered with another account' },
        { status: 409 }
      )
    }

    // Update user KYC information
    const updatedUser = await prisma.user.update({
      where: { supabaseId: supabaseUser.id },
      data: {
        panCard,
        aadharCard,
        kycStatus: 'SUBMITTED',
        kycDocuments: documents ? { documents } : undefined
      }
    })

    return NextResponse.json({
      message: 'KYC information updated successfully',
      kycStatus: updatedUser.kycStatus
    })

  } catch (error) {
    console.error('Error updating KYC:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}