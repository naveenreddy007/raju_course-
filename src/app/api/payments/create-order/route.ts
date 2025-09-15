import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createRazorpayOrder } from '@/lib/razorpay'
import { packagePricing } from '@/lib/utils'
import { PackageType } from '@/types'
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

    const user = session.user

    const { packageType, courseId, amount, referralCode } = await request.json()

    let orderAmount: number
    let receipt: string
    let orderNotes: any
    let orderType: string

    if (packageType) {
      // Package purchase
      if (!Object.values(PackageType).includes(packageType)) {
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

      orderAmount = pricing.final
      receipt = `pkg_${packageType}_${user.id}_${Date.now()}`
      orderType = 'package'
      orderNotes = {
        packageType,
        userId: user.id,
        userEmail: user.email || '',
        referralCode: referralCode || '',
        baseAmount: pricing.base.toString(),
        gstAmount: pricing.gst.toString(),
        finalAmount: pricing.final.toString(),
        type: 'package'
      }
    } else if (courseId) {
      // Course purchase
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Invalid course amount' },
          { status: 400 }
        )
      }

      // Verify course exists
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, title: true, price: true, isPublished: true }
      })

      if (!course || !course.isPublished) {
        return NextResponse.json(
          { error: 'Course not found or not available' },
          { status: 404 }
        )
      }

      orderAmount = amount
      receipt = `course_${courseId}_${user.id}_${Date.now()}`
      orderType = 'course'
      orderNotes = {
        courseId,
        courseTitle: course.title,
        userId: user.id,
        userEmail: user.email || '',
        referralCode: referralCode || '',
        amount: amount.toString(),
        type: 'course'
      }
    } else {
      return NextResponse.json(
        { error: 'Either packageType or courseId is required' },
        { status: 400 }
      )
    }

    // Create Razorpay order
    const order = await createRazorpayOrder(
      orderAmount,
      receipt,
      orderNotes
    )

    return NextResponse.json({
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      type: orderType
    })

  } catch (error) {
    console.error('Error creating payment order:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}