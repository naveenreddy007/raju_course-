'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Share2, 
  Copy, 
  ExternalLink,
  TrendingUp,
  Eye,
  Calendar,
  Package,
  IndianRupee,
  RefreshCw,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { authenticatedFetch } from '@/lib/auth-utils'

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

export default function ReferralsPage() {
  const { user, loading } = useAuth()
  const [referralData, setReferralData] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      fetchReferralData()
    }
  }, [user, loading])

  const fetchReferralData = async () => {
    try {
      const [statsResponse, generateResponse] = await Promise.all([
        authenticatedFetch('/api/referrals/stats'),
        authenticatedFetch('/api/referrals/generate', {
          method: 'POST'
        })
      ])

      const [statsData, generateData] = await Promise.all([
        statsResponse.json(),
        generateResponse.json()
      ])

      if (statsData.success && generateData.success) {
        setReferralData({
          stats: statsData.stats,
          referrals: statsData.referrals,
          commissions: statsData.commissions,
          packageStats: statsData.packageStats,
          recentActivity: statsData.recentActivity,
          affiliate: generateData.affiliate,
          sharingLinks: generateData.sharingLinks
        })
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
      toast.error('Failed to load referral data')
    } finally {
      setDataLoading(false)
    }
  }

  const copyReferralLink = async () => {
    if (referralData?.affiliate?.referralLink) {
      try {
        await navigator.clipboard.writeText(referralData.affiliate.referralLink)
        toast.success('Referral link copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy referral link')
      }
    }
  }

  const copyReferralCode = async () => {
    if (referralData?.affiliate?.referralCode) {
      try {
        await navigator.clipboard.writeText(referralData.affiliate.referralCode)
        toast.success('Referral code copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy referral code')
      }
    }
  }

  const refreshData = async () => {
    setGenerating(true)
    await fetchReferralData()
    setGenerating(false)
    toast.success('Referral data refreshed!')
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view referrals</h1>
          <Button asChild>
            <a href="/auth/login">Login</a>
          </Button>
        </div>
      </div>
    )
  }

  const stats = referralData?.stats || {
    totalReferrals: 0,
    directReferrals: 0,
    indirectReferrals: 0,
    totalEarnings: 0,
    directEarnings: 0,
    indirectEarnings: 0,
    pendingEarnings: 0,
    conversionRate: 0,
    totalClicks: 0
  }

  const affiliate = referralData?.affiliate
  const referrals = referralData?.referrals || []
  const commissions = referralData?.commissions || []
  const packageStats = referralData?.packageStats || {}
  const recentActivity = referralData?.recentActivity || []
  const sharingLinks = referralData?.sharingLinks || {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Network</h1>
              <p className="text-gray-600">Manage your referrals and track your earnings</p>
            </div>
            <Button onClick={refreshData} disabled={generating} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Direct: {stats.directReferrals}</span>
                  <span>Indirect: {stats.indirectReferrals}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
                <p className="text-xs text-muted-foreground">
                  Pending: {formatCurrency(stats.pendingEarnings)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalClicks} total clicks
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commission Split</CardTitle>
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
                </div>
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
                  Your Referral Information
                </CardTitle>
                <CardDescription>
                  Share your referral link or code to start earning commissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Referral Link</label>
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
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Referral Code</label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <code className="flex-1 text-sm text-gray-700 font-mono">
                      {affiliate.referralCode}
                    </code>
                    <Button
                      onClick={copyReferralCode}
                      size="sm"
                      variant="outline"
                      className="flex-shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Social Sharing Links */}
                {Object.keys(sharingLinks).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Quick Share</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(sharingLinks).map(([platform, link]) => (
                        <Button
                          key={platform}
                          asChild
                          size="sm"
                          variant="outline"
                          className="capitalize"
                        >
                          <a href={link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            {platform}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Detailed Information Tabs */}
        <motion.div variants={fadeInUp}>
          <Tabs defaultValue="referrals" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="referrals">My Referrals</TabsTrigger>
              <TabsTrigger value="commissions">Commission History</TabsTrigger>
              <TabsTrigger value="packages">Package Performance</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="referrals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Your Referral Network</CardTitle>
                  <CardDescription>
                    People who joined using your referral link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {referrals.length > 0 ? (
                    <div className="space-y-4">
                      {referrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{referral.referredUser?.name || 'Anonymous User'}</p>
                              <p className="text-sm text-gray-500">
                                Joined {new Date(referral.createdAt).toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={referral.level === 1 ? 'default' : 'secondary'}>
                                  Level {referral.level}
                                </Badge>
                                {referral.hasPurchased && (
                                  <Badge variant="outline" className="text-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(referral.totalCommissionEarned || 0)}
                            </p>
                            <p className="text-sm text-gray-500">Total Earned</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No referrals yet. Start sharing your link!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Commission History</CardTitle>
                  <CardDescription>
                    Your earnings from referral commissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {commissions.length > 0 ? (
                    <div className="space-y-4">
                      {commissions.map((commission) => (
                        <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              commission.status === 'PAID' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {commission.status === 'PAID' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{commission.description}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(commission.createdAt).toLocaleDateString()}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={commission.type === 'DIRECT' ? 'default' : 'secondary'}>
                                  {commission.type}
                                </Badge>
                                <Badge variant={commission.status === 'PAID' ? 'outline' : 'secondary'}>
                                  {commission.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              commission.status === 'PAID' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {formatCurrency(commission.amount)}
                            </p>
                            <p className="text-sm text-gray-500">{commission.percentage}% rate</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <IndianRupee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No commissions earned yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Package Performance</CardTitle>
                  <CardDescription>
                    See which packages your referrals prefer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(packageStats).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(packageStats).map(([packageName, stats]) => (
                        <div key={packageName} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">{packageName} Package</p>
                              <p className="text-sm text-gray-500">
                                {stats.purchases} purchases • {formatCurrency(stats.totalEarnings)} earned
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{stats.conversionRate}%</p>
                            <p className="text-sm text-gray-500">Conversion</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No package data available yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest referral and commission activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.type === 'commission' ? 'bg-green-100 text-green-600' :
                              activity.type === 'referral' ? 'bg-blue-100 text-blue-600' :
                              'bg-purple-100 text-purple-600'
                            }`}>
                              {activity.type === 'commission' ? <IndianRupee className="w-5 h-5" /> :
                               activity.type === 'referral' ? <Users className="w-5 h-5" /> :
                               <Eye className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{activity.description}</p>
                              <p className="text-sm text-gray-500">{activity.date}</p>
                            </div>
                          </div>
                          {activity.amount > 0 && (
                            <span className="font-semibold text-green-600">
                              +{formatCurrency(activity.amount)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No recent activity.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}