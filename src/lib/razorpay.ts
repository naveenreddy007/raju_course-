import Razorpay from 'razorpay'

if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
  throw new Error('NEXT_PUBLIC_RAZORPAY_KEY_ID is required')
}

if (!process.env.RAZORPAY_SECRET) {
  throw new Error('RAZORPAY_SECRET is required')
}

export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
})

export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

// Razorpay order creation interface
export interface RazorpayOrderRequest {
  amount: number // Amount in paise (INR)
  currency: string
  receipt: string
  notes?: Record<string, string>
}

// Razorpay order response interface
export interface RazorpayOrder {
  id: string
  entity: string
  amount: number
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  offer_id: string | null
  status: 'created' | 'attempted' | 'paid'
  attempts: number
  notes: Record<string, string>
  created_at: number
}

// Payment verification interface
export interface RazorpayPaymentVerification {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// Utility function to create order
export async function createRazorpayOrder(
  amount: number,
  receipt: string,
  notes?: Record<string, string>
): Promise<RazorpayOrder> {
  try {
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt,
      notes: notes || {}
    })

    return order as RazorpayOrder
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    throw new Error('Failed to create payment order')
  }
}

// Utility function to verify payment signature
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const crypto = require('crypto')
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex')

    return generated_signature === signature
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error)
    return false
  }
}