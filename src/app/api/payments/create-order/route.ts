import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createRazorpayOrder } from '@/lib/razorpay'
import { packagePricing } from '@/lib/utils'
import { PackageType } from '@/types'

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

    const { packageType, referralCode } = await request.json()

    if (!packageType || !Object.values(PackageType).includes(packageType)) {
      return NextResponse.json(
        { error: 'Invalid package type' },
        { status: 400 }
      )
    }

    // Get package pricing
    const pricing = packagePricing[packageType as PackageType]
    if (!pricing) {
      return NextResponse.json(
        { error: 'Package pricing not found' },
        { status: 400 }
      )
    }

    // Create unique receipt ID
    const receipt = `pkg_${packageType}_${user.id}_${Date.now()}`

    // Create Razorpay order
    const order = await createRazorpayOrder(
      pricing.final,
      receipt,
      {
        packageType,
        userId: user.id,
        userEmail: user.email || '',
        referralCode: referralCode || '',
        baseAmount: pricing.base.toString(),
        gstAmount: pricing.gst.toString(),
        finalAmount: pricing.final.toString()
      }
    )

    // Store order details in database (you might want to create an orders table)
    // For now, we'll return the order details

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      },
      packageDetails: {
        type: packageType,
        pricing,
        referralCode
      }
    })

  } catch (error) {
    console.error('Error creating payment order:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}