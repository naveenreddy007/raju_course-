'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard,
  Users,
  GraduationCap,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  UserCheck,
  CreditCard,
  BarChart3,
  Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

interface AdminNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const adminNavItems: AdminNavItem[] = [
  {
    label: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Dashboard overview and analytics'
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    description: 'Manage user accounts and KYC'
  },
  {
    label: 'Courses',
    href: '/admin/courses',
    icon: GraduationCap,
    description: 'Manage courses and content'
  },
  {
    label: 'Commissions',
    href: '/admin/commissions',
    icon: TrendingUp,
    description: 'Track affiliate commissions'
  },
  {
    label: 'Transactions',
    href: '/admin/transactions',
    icon: CreditCard,
    description: 'View payment transactions'
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'Business analytics and reports'
  },
  {
    label: 'KYC Verification',
    href: '/admin/kyc',
    icon: UserCheck,
    description: 'Review KYC submissions'
  },
  {
    label: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    description: 'Send system notifications'
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'System configuration'
  }
]

export function AdminNavigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, signOut, isSuperAdmin } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin/login')
  }

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  return (
    <div>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-gray-900 lg:border-r lg:border-gray-700">
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
                <p className="text-xs text-gray-400">Learning Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-purple-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User Info & Sign Out */}
          <div className="flex-shrink-0 p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
          </div>
          <Button
            onClick={toggleMobileMenu}
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-800 border-t border-gray-700"
            >
              <div className="px-2 py-3 space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-purple-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
                
                <div className="pt-2 mt-2 border-t border-gray-700">
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminNavigation