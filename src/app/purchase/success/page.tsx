'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Gift, 
  Share2, 
  ArrowRight, 
  Copy,
  Users,
  Trophy,
  IndianRupee,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { PackageType } from '@/types'
import { formatCurrency, packagePricing } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function PaymentSuccessPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [copied, setCopied] = useState(false)
  const [transactionData, setTransactionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const transactionId = searchParams.get('transaction')
  const packageType = searchParams.get('package') as PackageType

  useEffect(() => {
    if (!transactionId || !packageType) {
      router.push('/purchase')
      return
    }
    
    // Fetch transaction details
    fetchTransactionDetails()
  }, [transactionId, packageType])

  const fetchTransactionDetails = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setTransactionData(data)
      }
    } catch (error) {
      console.error('Error fetching transaction details:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = async () => {
    if (transactionData?.affiliate?.referralCode) {
      await navigator.clipboard.writeText(transactionData.affiliate.referralCode)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}/auth/register?ref=${transactionData?.affiliate?.referralCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join AffiliateLearn',
          text: 'Start your learning journey and earn with affiliates!',
          url: referralLink
        })
      } catch (error) {
        // Fallback to copy
        await navigator.clipboard.writeText(referralLink)
        toast({
          title: "Link copied!",
          description: "Referral link copied to clipboard",
        })
      }
    } else {
      await navigator.clipboard.writeText(referralLink)
      toast({
        title: "Link copied!",
        description: "Referral link copied to clipboard",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const packageDetails = packagePricing[packageType]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Welcome to AffiliateLearn. Your journey starts now!</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Transaction Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Package Activated
                </CardTitle>
                <CardDescription>
                  Your {packageType} package is now active
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Package:</span>
                  <Badge variant="secondary">{packageType} Package</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="font-semibold">{formatCurrency(packageDetails?.final || 0)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Transaction ID:</span>
                  <span className="text-sm font-mono">{transactionId}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Date:</span>
                  <span className="text-sm">{new Date().toLocaleDateString()}</span>
                </div>

                {transactionData?.hasReferrer && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center text-blue-800">
                      <Gift className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">
                        Your referrer will receive commission for your purchase!
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Referral Code */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-primary" />
                  Your Referral Code
                </CardTitle>
                <CardDescription>
                  Start earning by referring others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Your Referral Code:</p>
                      <p className="text-2xl font-bold text-primary font-mono">
                        {transactionData?.affiliate?.referralCode || 'Loading...'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyReferralCode}
                      disabled={!transactionData?.affiliate?.referralCode}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Earning Potential:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <IndianRupee className="w-3 h-3 mr-1" />
                      Direct Referrals: ₹1,875 - ₹5,625 per sale
                    </div>
                    <div className="flex items-center">
                      <IndianRupee className="w-3 h-3 mr-1" />
                      Indirect Referrals: ₹150 - ₹1,000 per sale
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={shareReferralLink} 
                  className="w-full"
                  disabled={!transactionData?.affiliate?.referralCode}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Referral Link
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                Get started with your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col space-y-2"
                  onClick={() => router.push('/courses')}
                >
                  <BookOpen className="w-6 h-6" />
                  <span>Explore Courses</span>
                  <span className="text-xs text-gray-500">Start learning immediately</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col space-y-2"
                  onClick={() => router.push('/dashboard/earnings')}
                >
                  <IndianRupee className="w-6 h-6" />
                  <span>Earnings Dashboard</span>
                  <span className="text-xs text-gray-500">Track your commissions</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex-col space-y-2"
                  onClick={() => router.push('/dashboard/referrals')}
                >
                  <Users className="w-6 h-6" />
                  <span>Refer & Earn</span>
                  <span className="text-xs text-gray-500">Share and earn money</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <Button 
            size="lg" 
            onClick={() => router.push('/dashboard')}
            className="min-w-[200px]"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}