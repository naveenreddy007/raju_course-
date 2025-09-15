'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IndianRupee, TrendingUp, Calendar, Download, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { authenticatedFetch } from '@/lib/auth-utils'
import { toast } from 'sonner'

interface EarningsData {
  affiliate: {
    referralCode: string
    commissionRate: number
    totalEarnings: number
  }
  earnings: {
    totalEarnings: number
    pendingEarnings: number
    paidEarnings: number
  }
  commissions: Array<{
    id: string
    amount: number
    type: string
    status: string
    createdAt: string
    transaction: any
  }>
  referrals: Array<{
    id: string
    referredUser: {
      name: string
      email: string
      joinedAt: string
      totalPurchases: number
    }
    createdAt: string
  }>
  stats: {
    totalReferrals: number
    activeReferrals: number
    totalCommissions: number
  }
}

export default function EarningsPage() {
  const { user, loading } = useAuth()
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const fetchEarningsData = async () => {
    try {
      setDataLoading(true)
      const response = await authenticatedFetch('/api/dashboard/earnings')
      const data = await response.json()
      
      if (data.success) {
        setEarningsData(data.data)
      } else {
        toast.error('Failed to load earnings data')
      }
    } catch (error) {
      console.error('Error fetching earnings:', error)
      toast.error('Failed to load earnings data')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (user && !loading) {
      fetchEarningsData()
    }
  }, [user, loading])

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
        <h1 className="text-2xl font-bold mb-4">Please log in to view your earnings</h1>
        <Button asChild>
          <a href="/auth/login">Login</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings Overview</h1>
          <p className="text-gray-600">Track your commission earnings and withdrawal history</p>
        </div>

        {/* Earnings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(earningsData?.earnings.totalEarnings || 0)}
              </div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(earningsData?.earnings.pendingEarnings || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Pending earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Earnings</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(earningsData?.earnings.paidEarnings || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Successfully paid out</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings History */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
            <CardDescription>Your commission earnings and transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            {earningsData?.commissions && earningsData.commissions.length > 0 ? (
              <div className="space-y-4">
                {earningsData.commissions.map((commission) => (
                  <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{commission.type} Commission</p>
                        <p className="text-sm text-gray-500">
                          {new Date(commission.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +{formatCurrency(commission.amount)}
                      </p>
                      <p className={`text-xs capitalize ${
                        commission.status === 'paid' ? 'text-green-600' : 
                        commission.status === 'pending' ? 'text-yellow-600' : 'text-gray-500'
                      }`}>
                        {commission.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IndianRupee className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm">No earnings yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start referring friends to earn commissions!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}