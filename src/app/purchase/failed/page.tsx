'use client'

import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  XCircle, 
  AlertTriangle, 
  RotateCcw, 
  ArrowLeft,
  HelpCircle,
  Phone,
  Mail
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function PaymentFailedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const error = searchParams.get('error')
  const orderId = searchParams.get('order')

  const commonIssues = [
    {
      title: "Insufficient Balance",
      description: "Please check if you have sufficient balance in your account",
      icon: AlertTriangle
    },
    {
      title: "Network Issues",
      description: "Poor internet connection during payment processing",
      icon: AlertTriangle
    },
    {
      title: "Bank Restrictions",
      description: "Your bank might have restrictions on online payments",
      icon: AlertTriangle
    },
    {
      title: "Card Issues",
      description: "Expired card or incorrect card details entered",
      icon: AlertTriangle
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Failure Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600">Don't worry, your money is safe. No amount has been deducted.</p>
        </motion.div>

        {/* Error Details */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                {error === 'cancelled' 
                  ? 'Payment was cancelled by user'
                  : error === 'timeout'
                  ? 'Payment session timed out'
                  : error === 'failed'
                  ? 'Payment processing failed'
                  : 'An unexpected error occurred during payment processing'
                }
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Try Again
                </CardTitle>
                <CardDescription>
                  Retry your payment with these options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => router.push('/purchase')} 
                  className="w-full"
                  size="lg"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Payment
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/dashboard')} 
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/courses')} 
                  className="w-full"
                >
                  Browse Free Courses
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Need Help?
                </CardTitle>
                <CardDescription>
                  Our support team is here to assist you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Email Support</p>
                      <p className="text-xs text-gray-600">support@affiliatelearn.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-3 bg-green-50 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium">Phone Support</p>
                      <p className="text-xs text-gray-600">+91 98765 43210</p>
                    </div>
                  </div>
                </div>

                {orderId && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Reference Order ID:</p>
                    <p className="text-sm font-mono break-all">{orderId}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Common Issues */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Common Payment Issues</CardTitle>
              <CardDescription>
                Check these common issues that might cause payment failures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {commonIssues.map((issue, index) => {
                  const Icon = issue.icon
                  return (
                    <div key={index} className="flex items-start p-3 bg-yellow-50 rounded-lg">
                      <Icon className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{issue.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{issue.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Payment Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Ensure you have a stable internet connection</p>
                <p>• Check if your card is enabled for online transactions</p>
                <p>• Verify card details including expiry date and CVV</p>
                <p>• Try using a different payment method (UPI, Net Banking, etc.)</p>
                <p>• Contact your bank if the issue persists</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}