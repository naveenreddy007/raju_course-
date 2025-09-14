'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Copy, Share2, Gift, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'

export default function ReferralsPage() {
  const { user, loading } = useAuth()
  const [referralData, setReferralData] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)

  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0
  })

  useEffect(() => {
    if (user && !loading) {
      fetchReferralData()
    }
  }, [user, loading])

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()

      if (data.success) {
        setReferralStats({
          totalReferrals: data.stats.totalReferrals || 0,
          activeReferrals: data.stats.activeReferrals || 0,
          totalEarnings: data.stats.totalEarnings || 0
        })
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const copyReferralLink = () => {
    if (user?.affiliate?.referralCode) {
      const referralLink = `${window.location.origin}/auth/register?ref=${user.affiliate.referralCode}`
      navigator.clipboard.writeText(referralLink)
      alert('Referral link copied to clipboard!')
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
        <h1 className="text-2xl font-bold mb-4">Please log in to view your referrals</h1>
        <Button asChild>
          <a href="/auth/login">Login</a>
        </Button>
      </div>
    )
  }

  const referralLink = user?.affiliate?.referralCode 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/register?ref=${user.affiliate.referralCode}`
    : ''

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Management</h1>
          <p className="text-gray-600">Manage your referrals and track your network growth</p>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">People you've referred</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{referralStats.activeReferrals}</div>
              <p className="text-xs text-muted-foreground">Currently earning members</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>Share this link to earn commissions from new registrations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input 
                value={referralLink}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyReferralLink} variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Join AffiliateLearn',
                      text: 'Join me on AffiliateLearn and start earning!',
                      url: referralLink
                    })
                  }
                }}
                variant="outline"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Your Referral Code:</strong> {user?.affiliate?.referralCode}</p>
            </div>
          </CardContent>
        </Card>

        {/* Referral List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
            <CardDescription>People who joined using your referral code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm">No referrals yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Share your referral link to start building your network!
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}