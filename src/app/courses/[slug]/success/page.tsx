'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, ArrowRight, BookOpen, Trophy, Share2, Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'

interface Transaction {
  id: string
  amount: number
  status: string
  createdAt: string
  course: {
    id: string
    title: string
    description: string
    thumbnail: string
    slug: string
  }
  referrer?: {
    name: string
    referralCode: string
  }
}

export default function CourseSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const transactionId = searchParams.get('transaction_id')

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (!transactionId) {
      router.push('/courses')
      return
    }
    fetchTransaction()
  }, [user, transactionId])

  const fetchTransaction = async () => {
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${user?.accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Transaction not found')
      }
      
      const data = await response.json()
      setTransaction(data)
    } catch (error) {
      console.error('Error fetching transaction:', error)
      toast.error('Failed to load transaction details')
      router.push('/courses')
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = () => {
    if (user?.affiliate?.referralCode) {
      navigator.clipboard.writeText(user.affiliate.referralCode)
      toast.success('Referral code copied to clipboard!')
    }
  }

  const shareReferralLink = () => {
    if (user?.affiliate?.referralCode) {
      const referralLink = `${window.location.origin}?ref=${user.affiliate.referralCode}`
      navigator.clipboard.writeText(referralLink)
      toast.success('Referral link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading transaction details...</p>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Transaction Not Found</h1>
          <Button onClick={() => router.push('/courses')}>Back to Courses</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">You now have access to your course</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Course Activated</span>
                </CardTitle>
                <CardDescription>
                  Your course is now available in your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={transaction.course.thumbnail || '/placeholder-course.jpg'}
                    alt={transaction.course.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{transaction.course.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {transaction.course.description}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Amount Paid</span>
                    <span className="font-semibold">{formatCurrency(transaction.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transaction ID</span>
                    <span className="text-sm font-mono">{transaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>

                {transaction.referrer && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Referrer:</strong> {transaction.referrer.name} will receive a commission for this purchase.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Referral Card */}
          {user?.affiliate?.referralCode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Share2 className="w-5 h-5" />
                    <span>Your Referral Code</span>
                  </CardTitle>
                  <CardDescription>
                    Share and earn commissions on every sale
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Your Code</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyReferralCode}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-2xl font-bold text-center py-2 bg-white rounded border-2 border-dashed border-blue-300">
                      {user.affiliate.referralCode}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Earning Potential:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Direct referrals: 10-15% commission</li>
                      <li>• Second level: 5-10% commission</li>
                      <li>• Lifetime earnings on all purchases</li>
                    </ul>
                  </div>

                  <Button
                    onClick={shareReferralLink}
                    variant="outline"
                    className="w-full"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Referral Link
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Button
            onClick={() => router.push(`/courses/${transaction.course.slug}`)}
            className="flex items-center justify-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>Start Learning</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/earnings')}
            className="flex items-center justify-center space-x-2"
          >
            <Trophy className="w-4 h-4" />
            <span>Earnings Dashboard</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => router.push('/refer')}
            className="flex items-center justify-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Refer & Earn</span>
          </Button>
        </motion.div>

        {/* Go to Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <Button
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="text-gray-600 hover:text-gray-900"
          >
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  )
}