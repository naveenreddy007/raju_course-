'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  Loader,
  IndianRupee,
  Gift,
  Users,
  Star,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth'
import { PackageType } from '@/types'
import { formatCurrency, packagePricing } from '@/lib/utils'

declare global {
  interface Window {
    Razorpay: any
  }
}

const packages = [
  {
    type: 'SILVER' as PackageType,
    name: 'Silver Package',
    price: packagePricing.SILVER,
    features: [
      'Access to 5 Premium Courses',
      'Direct Commission: ₹1,875 - ₹2,875',
      'Indirect Commission: ₹150 - ₹400',
      'Basic Analytics Dashboard',
      'Email Support',
      'Mobile App Access'
    ],
    popular: false
  },
  {
    type: 'GOLD' as PackageType,
    name: 'Gold Package',
    price: packagePricing.GOLD,
    features: [
      'Access to 10 Premium Courses',
      'Direct Commission: ₹1,875 - ₹3,875',
      'Indirect Commission: ₹200 - ₹600',
      'Advanced Analytics Dashboard',
      'Priority Support',
      'Monthly Webinars',
      'Exclusive Resources'
    ],
    popular: true
  },
  {
    type: 'PLATINUM' as PackageType,
    name: 'Platinum Package',
    price: packagePricing.PLATINUM,
    features: [
      'Access to All 15+ Courses',
      'Direct Commission: ₹1,875 - ₹5,625',
      'Indirect Commission: ₹200 - ₹1,000',
      'Real-time Analytics Dashboard',
      '24/7 VIP Support',
      'Weekly 1-on-1 Sessions',
      'White-label Materials',
      'Early Access to New Content'
    ],
    popular: false
  }
]

export default function PurchasePackagePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null)
  const [referralCode, setReferralCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Pre-select package from URL params
  useEffect(() => {
    const packageParam = searchParams.get('package')
    if (packageParam) {
      const packageType = packageParam.toUpperCase() as PackageType
      if (Object.values(PackageType).includes(packageType)) {
        setSelectedPackage(packageType)
      }
    }

    // Pre-fill referral code from URL
    const refParam = searchParams.get('ref')
    if (refParam) {
      setReferralCode(refParam)
    }
  }, [searchParams])

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => setScriptLoaded(true)
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/purchase')
    }
  }, [user, loading, router])

  const handlePurchase = async () => {
    if (!selectedPackage || !user || !scriptLoaded) return

    setProcessing(true)

    try {
      // Create order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          packageType: selectedPackage,
          referralCode
        })
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'AffiliateLearn',
        description: `${selectedPackage} Package Purchase`,
        order_id: orderData.order.id,
        prefill: {
          name: user.name,
          email: user.email
        },
        theme: {
          color: '#7C3AED'
        },
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                packageType: selectedPackage,
                amount: orderData.order.amount,
                referralCode
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              router.push(`/purchase/success?transaction=${verifyData.data.transactionId}&package=${selectedPackage}`)
            } else {
              throw new Error(verifyData.error || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            router.push('/purchase/failed')
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false)
          }
        }
      }

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (error) {
      console.error('Purchase error:', error)
      alert('Failed to initiate payment. Please try again.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const selectedPkg = packages.find(pkg => pkg.type === selectedPackage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Learning Package</h1>
          <p className="text-gray-600">Select a package to start your learning journey and affiliate earning</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Package Selection */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {packages.map((pkg) => (
                <motion.div
                  key={pkg.type}
                  whileHover={{ scale: 1.02 }}
                  className={`cursor-pointer transition-all ${
                    selectedPackage === pkg.type 
                      ? 'ring-2 ring-primary' 
                      : 'hover:shadow-lg'
                  }`}
                >
                  <Card 
                    className={`relative ${pkg.popular ? 'border-primary' : ''}`}
                    onClick={() => setSelectedPackage(pkg.type)}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{pkg.name}</CardTitle>
                          <div className="mt-2">
                            <div className="text-3xl font-bold text-primary">
                              {formatCurrency(pkg.price.final)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Base: {formatCurrency(pkg.price.base)} + GST: {formatCurrency(pkg.price.gst)}
                            </div>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedPackage === pkg.type 
                            ? 'border-primary bg-primary' 
                            : 'border-gray-300'
                        }`}>
                          {selectedPackage === pkg.type && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-3">
                        {pkg.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Purchase Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Purchase Summary
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Referral Code */}
                  <div className="space-y-2">
                    <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                    <div className="relative">
                      <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="referralCode"
                        placeholder="Enter referral code"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Help your referrer earn commission by entering their code
                    </p>
                  </div>

                  {/* Selected Package Details */}
                  {selectedPkg && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900">{selectedPkg.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Amount:</span>
                          <span>{formatCurrency(selectedPkg.price.base)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST (18%):</span>
                          <span>{formatCurrency(selectedPkg.price.gst)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-blue-900 border-t border-blue-200 pt-2">
                          <span>Total Amount:</span>
                          <span>{formatCurrency(selectedPkg.price.final)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">What you get:</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-green-500" />
                        Your unique referral code
                      </div>
                      <div className="flex items-center">
                        <IndianRupee className="w-4 h-4 mr-2 text-green-500" />
                        Two-level commission earning
                      </div>
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-green-500" />
                        Secure payment via Razorpay
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePurchase}
                    disabled={!selectedPackage || processing || !scriptLoaded}
                    className="w-full"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay {selectedPkg ? formatCurrency(selectedPkg.price.final) : 'Now'}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Powered by Razorpay • Secure payment gateway
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}