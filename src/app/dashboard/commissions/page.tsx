'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  IndianRupee, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
  Calendar,
  Users,
  Package,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function CommissionsPage() {
  const { user, loading } = useAuth()
  const [commissionData, setCommissionData] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (user && !loading) {
      fetchCommissionData()
    }
  }, [user, loading])

  const fetchCommissionData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setDataLoading(false)
        return
      }

      const response = await fetch('/api/commissions/history', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success) {
        setCommissionData(data)
      }
    } catch (error) {
      console.error('Error fetching commission data:', error)
      toast.error('Failed to load commission data')
    } finally {
      setDataLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchCommissionData()
    setRefreshing(false)
    toast.success('Commission data refreshed!')
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
          <h1 className="text-2xl font-bold mb-4">Please log in to view commissions</h1>
          <Button asChild>
            <a href="/auth/login">Login</a>
          </Button>
        </div>
      </div>
    )
  }

  const summary = commissionData?.summary || {
    totalEarnings: 0,
    paidAmount: 0,
    pendingAmount: 0,
    directEarnings: 0,
    indirectEarnings: 0,
    totalCommissions: 0,
    thisMonthEarnings: 0,
    lastMonthEarnings: 0
  }

  const commissions = commissionData?.commissions || []
  
  // Filter commissions based on selected filters
  const filteredCommissions = commissions.filter(commission => {
    const typeMatch = filter === 'all' || commission.type.toLowerCase() === filter.toLowerCase()
    const statusMatch = statusFilter === 'all' || commission.status.toLowerCase() === statusFilter.toLowerCase()
    return typeMatch && statusMatch
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-orange-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600'
      case 'PENDING':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'DIRECT':
        return <Users className="w-4 h-4 text-blue-600" />
      case 'INDIRECT':
        return <TrendingUp className="w-4 h-4 text-purple-600" />
      default:
        return <Package className="w-4 h-4 text-gray-600" />
    }
  }

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Commission History</h1>
              <p className="text-gray-600">Track your earnings and commission details</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={refreshData} disabled={refreshing} variant="outline">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
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
                <div className="text-2xl font-bold">{formatCurrency(summary.totalEarnings)}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalCommissions} total commissions
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.paidAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  Available in your account
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.pendingAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  Processing for payment
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.thisMonthEarnings)}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.thisMonthEarnings >= summary.lastMonthEarnings ? '+' : ''}
                  {((summary.thisMonthEarnings - summary.lastMonthEarnings) / (summary.lastMonthEarnings || 1) * 100).toFixed(1)}% from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Commission Breakdown */}
        <motion.div variants={fadeInUp} className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Commission Breakdown</CardTitle>
              <CardDescription>
                Your earnings split by commission type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Direct Commissions</p>
                        <p className="text-sm text-blue-700">From your direct referrals</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-900">{formatCurrency(summary.directEarnings)}</p>
                      <p className="text-sm text-blue-700">15% rate</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-purple-900">Indirect Commissions</p>
                        <p className="text-sm text-purple-700">From 2nd level referrals</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-purple-900">{formatCurrency(summary.indirectEarnings)}</p>
                      <p className="text-sm text-purple-700">5% rate</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Commission List */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Commission History</CardTitle>
                  <CardDescription>
                    Detailed list of all your commission earnings
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="indirect">Indirect</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCommissions.length > 0 ? (
                <div className="space-y-4">
                  {filteredCommissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(commission.type)}
                          {getStatusIcon(commission.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{commission.description}</p>
                            <Badge variant={commission.type === 'DIRECT' ? 'default' : 'secondary'}>
                              {commission.type}
                            </Badge>
                            <Badge variant={commission.status === 'PAID' ? 'outline' : 'secondary'}>
                              {commission.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(commission.createdAt).toLocaleDateString()}
                            </span>
                            <span>Rate: {commission.percentage}%</span>
                            {commission.packagePurchase && (
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {commission.packagePurchase.package.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getStatusColor(commission.status)}`}>
                          {formatCurrency(commission.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {commission.status === 'PAID' ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <IndianRupee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No commissions found</h3>
                  <p className="text-gray-500 mb-4">
                    {filter !== 'all' || statusFilter !== 'all' 
                      ? 'Try adjusting your filters to see more results.'
                      : 'Start referring people to earn your first commission!'}
                  </p>
                  {filter !== 'all' || statusFilter !== 'all' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setFilter('all')
                        setStatusFilter('all')
                      }}
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <Button asChild>
                      <a href="/packages">Browse Packages</a>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}