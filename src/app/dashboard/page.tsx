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
  AlertCircle,
  DollarSign,
  EyeOff
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)

  useEffect(() => {
    if (user && !loading) {
      fetchDashboardData()
      fetchEnrolledCourses()
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

  const fetchEnrolledCourses = async () => {
    try {
      const response = await authenticatedFetch('/api/user/enrollments')
      const data = await response.json()

      if (data.success) {
        setEnrolledCourses(data.enrollments || [])
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error)
    } finally {
      setCoursesLoading(false)
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

        {/* User Package Display */}
        {dashboardData?.data?.packages && dashboardData.data.packages.length > 0 && (
          <motion.div 
            className="mb-8"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  Your Active Package
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Package Ring/Badge */}
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        dashboardData.data.packages[0].name.includes('Silver') 
                          ? 'bg-gradient-to-br from-gray-300 to-gray-500 ring-4 ring-gray-200' 
                          : dashboardData.data.packages[0].name.includes('Gold')
                          ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 ring-4 ring-yellow-200'
                          : dashboardData.data.packages[0].name.includes('Platinum')
                          ? 'bg-gradient-to-br from-purple-400 to-purple-700 ring-4 ring-purple-200'
                          : 'bg-gradient-to-br from-gray-300 to-gray-500 ring-4 ring-gray-200'
                      }`}>
                        {dashboardData.data.packages[0].name.includes('Silver') && (
                          <Award className="w-8 h-8 text-white" />
                        )}
                        {dashboardData.data.packages[0].name.includes('Gold') && (
                          <Award className="w-8 h-8 text-white" />
                        )}
                        {dashboardData.data.packages[0].name.includes('Platinum') && (
                          <Award className="w-8 h-8 text-white" />
                        )}
                      </div>
                      {/* Status indicator */}
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    {/* Package Info */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {dashboardData.data.packages[0].name}
                      </h3>
                      <p className="text-gray-600">
                        Purchased on {new Date(dashboardData.data.packages[0].created_at).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Active
                        </span>
                        <span className="text-sm text-gray-600">
                          Amount: ₹{dashboardData.data.packages[0].amount?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Package Benefits */}
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-2">Commission Rates</div>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-green-600 font-semibold">
                          Direct: {dashboardData.data.packages[0].package?.commissionRates?.direct || 0}%
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-blue-600 font-semibold">
                          Indirect: {dashboardData.data.packages[0].package?.commissionRates?.indirect || 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Referral Link Section */}
        {dashboardData?.data?.affiliate && (
          <motion.div 
            className="mb-8"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Your Referral Link
                </CardTitle>
                <CardDescription>
                  Share this link to earn commissions when people join through your referral
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Referral Code Display */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Referral Code
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-gray-50 border rounded-lg font-mono text-sm">
                        {dashboardData.data.affiliate.referral_code}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(dashboardData.data.affiliate.referral_code);
                          toast.success('Referral code copied!');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Referral Link Display */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Referral Link
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3 bg-gray-50 border rounded-lg text-sm break-all">
                        {dashboardData.data.affiliate.referral_link}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(dashboardData.data.affiliate.referral_link);
                          toast.success('Referral link copied!');
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {dashboardData.data.referrals?.total || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Referrals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        ₹{dashboardData.data.earnings?.total?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Earnings</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )})})

        {/* Enrolled Courses Section */}
        <motion.div 
          className="mb-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                My Enrolled Courses
              </CardTitle>
              <CardDescription>
                Continue your learning journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : enrolledCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {enrolledCourses.slice(0, 6).map((enrollment) => (
                    <div key={enrollment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
                            {enrollment.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {enrollment.category} • {enrollment.level}
                          </p>
                        </div>
                        <Badge 
                          variant={enrollment.status === 'COMPLETED' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {enrollment.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{enrollment.progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${enrollment.progressPercent}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button asChild size="sm" className="w-full">
                          <Link href={`/courses/${enrollment.slug}`}>
                            {enrollment.status === 'COMPLETED' ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Review Course
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-3 h-3 mr-1" />
                                Continue Learning
                              </>
                            )}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm">No enrolled courses yet</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">
                    Start learning by enrolling in courses!
                  </p>
                  <Button asChild size="sm">
                    <Link href="/courses">
                      Browse Courses
                    </Link>
                  </Button>
                </div>
              )}
              
              {enrolledCourses.length > 6 && (
                <div className="mt-4 text-center">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/courses">
                      View All Courses ({enrolledCourses.length})
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

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