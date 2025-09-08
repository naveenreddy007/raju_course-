'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Users, 
  TrendingUp, 
  IndianRupee, 
  UserCheck,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AdminNavigation } from '@/components/admin/admin-navigation'
import { useAuth } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'

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

interface AdminStats {
  totalUsers: number
  activeUsers: number
  pendingKyc: number
  approvedKyc: number
  totalRevenue: number
  totalCommissions: number
  pendingWithdrawals: number
  totalCourses: number
}

export default function AdminDashboardPage() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    pendingKyc: 0,
    approvedKyc: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    pendingWithdrawals: 0,
    totalCourses: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin())) {
      router.push('/admin/login')
    }
  }, [user, loading, isAdmin, router])

  // Load admin stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch('/api/admin/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to load admin stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    if (user && isAdmin()) {
      loadStats()
    }
  }, [user, isAdmin])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user || !isAdmin()) {
    return null
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      description: `${stats.activeUsers} active users`,
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Pending KYC',
      value: stats.pendingKyc.toLocaleString(),
      description: `${stats.approvedKyc} approved`,
      icon: UserCheck,
      color: 'yellow'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      description: 'From course purchases',
      icon: IndianRupee,
      color: 'green'
    },
    {
      title: 'Commission Paid',
      value: formatCurrency(stats.totalCommissions),
      description: 'To affiliates',
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Pending Withdrawals',
      value: stats.pendingWithdrawals.toLocaleString(),
      description: 'Awaiting approval',
      icon: Clock,
      color: 'orange'
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses.toLocaleString(),
      description: 'Available courses',
      icon: Activity,
      color: 'indigo'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        <div className="flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                  <p className="text-gray-600">Welcome back, {user.name}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    System Online
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <motion.div
              variants={staggerChildren}
              initial="initial"
              animate="animate"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {statCards.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <motion.div key={stat.title} variants={fadeInUp}>
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            {stat.title}
                          </CardTitle>
                          <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                            <Icon className={`h-5 w-5 text-${stat.color}-600`} />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-gray-900">
                            {loadingStats ? '...' : stat.value}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {stat.description}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <motion.div variants={fadeInUp}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Latest system activities and alerts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                          <div>
                            <p className="text-sm font-medium">
                              {stats.pendingKyc} KYC applications pending review
                            </p>
                            <p className="text-xs text-gray-600">Requires attention</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium">System backup completed</p>
                            <p className="text-xs text-gray-600">2 hours ago</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Activity className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">
                              {stats.activeUsers} users active in last 24h
                            </p>
                            <p className="text-xs text-gray-600">User engagement</p>
                          </div>
                        </div>
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
                        Common administrative tasks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <a 
                          href="/admin/kyc" 
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <UserCheck className="w-8 h-8 text-blue-600 mb-2" />
                          <p className="font-medium text-sm">Review KYC</p>
                          <p className="text-xs text-gray-600">{stats.pendingKyc} pending</p>
                        </a>
                        
                        <a 
                          href="/admin/withdrawals" 
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                          <p className="font-medium text-sm">Process Withdrawals</p>
                          <p className="text-xs text-gray-600">{stats.pendingWithdrawals} pending</p>
                        </a>
                        
                        <a 
                          href="/admin/users" 
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Users className="w-8 h-8 text-purple-600 mb-2" />
                          <p className="font-medium text-sm">Manage Users</p>
                          <p className="text-xs text-gray-600">{stats.totalUsers} total</p>
                        </a>
                        
                        <a 
                          href="/admin/analytics" 
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
                          <p className="font-medium text-sm">View Analytics</p>
                          <p className="text-xs text-gray-600">Reports & insights</p>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}