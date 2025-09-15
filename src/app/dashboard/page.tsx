'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Users, 
  IndianRupee, 
  BookOpen,
  Award,
  Eye,
  Share2,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { authenticatedFetch } from '@/lib/auth-utils';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (user && !loading) {
      fetchDashboardData()
    }
  }, [user, loading])

  const fetchDashboardData = async () => {
    try {
      const response = await authenticatedFetch('/api/dashboard/stats')
      const data = await response.json()

      if (data.success) {
        setDashboardData(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const copyReferralLink = async () => {
    if (dashboardData?.affiliate?.referralLink) {
      try {
        await navigator.clipboard.writeText(dashboardData.affiliate.referralLink)
        toast.success('Referral link copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy referral link')
      }
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to access your dashboard</h1>
        <Button asChild>
          <a href="/auth/login">Login</a>
        </Button>
      </div>
    )
  }

  // Use real data from API or fallback to basic stats
  const stats = dashboardData?.stats || {
    totalEarnings: 0,
    directEarnings: 0,
    indirectEarnings: 0,
    pendingEarnings: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    directReferrals: 0,
    indirectReferrals: 0,
    coursesCompleted: 0,
    currentBalance: 0,
    totalWithdrawn: 0,
    packagesPurchased: 0
  }

  // Use real activities from API
  const recentActivities = dashboardData?.recentActivities || []
  const referralStats = dashboardData?.referralStats || {
    totalClicks: 0,
    conversionRate: 0,
    topPerformingPackage: null,
    packageStats: {}
  }
  const affiliate = dashboardData?.affiliate || null

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your learning and earnings today.
          </p>
        </div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
                <p className="text-xs text-muted-foreground">
                  Current Balance: {formatCurrency(stats.currentBalance)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Breakdown</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Direct:</span>
                    <span className="font-semibold">{formatCurrency(stats.directEarnings)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">Indirect:</span>
                    <span className="font-semibold">{formatCurrency(stats.indirectEarnings)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-600">Pending:</span>
                    <span className="font-semibold">{formatCurrency(stats.pendingEarnings)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referral Network</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Direct: {stats.directReferrals}</span>
                  <span>Indirect: {stats.indirectReferrals}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeReferrals} active purchasers
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{referralStats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Conversion Rate
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {referralStats.totalClicks} total clicks
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Referral Link Section */}
        {affiliate && (
          <motion.div variants={fadeInUp} className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Your Referral Link
                </CardTitle>
                <CardDescription>
                  Share this link to earn commissions on referrals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <code className="flex-1 text-sm text-gray-700 truncate">
                    {affiliate.referralLink}
                  </code>
                  <Button
                    onClick={copyReferralLink}
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                  >
                    <a href={affiliate.referralLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  <strong>Referral Code:</strong> {affiliate.referralCode}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest earnings and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.type === 'commission' ? 'bg-green-100 text-green-600' :
                            activity.type === 'referral' ? 'bg-blue-100 text-blue-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {activity.type === 'commission' ? <IndianRupee className="w-4 h-4" /> :
                             activity.type === 'referral' ? <Users className="w-4 h-4" /> :
                             <Award className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">{activity.date}</p>
                              {activity.status && (
                                <div className={`flex items-center gap-1 text-xs ${
                                  activity.status === 'PAID' ? 'text-green-600' :
                                  activity.status === 'PENDING' ? 'text-orange-600' :
                                  'text-gray-600'
                                }`}>
                                  {activity.status === 'PAID' ? <CheckCircle className="w-3 h-3" /> :
                                   activity.status === 'PENDING' ? <Clock className="w-3 h-3" /> :
                                   <AlertCircle className="w-3 h-3" />}
                                  {activity.status}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {activity.amount > 0 && (
                          <span className={`text-sm font-semibold ${
                            activity.status === 'PAID' ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            +{formatCurrency(activity.amount)}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm">No activity yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Start referring friends to see your earnings here!
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/packages">
                      <Award className="w-4 h-4 mr-2" />
                      Browse Packages
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/dashboard/commissions">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Commission History
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/dashboard/referrals">
                      <Users className="w-4 h-4 mr-2" />
                      Referral Network
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link href="/dashboard/payouts">
                      <IndianRupee className="w-4 h-4 mr-2" />
                      Request Payout
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}