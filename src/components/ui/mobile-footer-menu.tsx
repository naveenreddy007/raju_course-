'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Home, 
  BookOpen, 
  TrendingUp, 
  User, 
  MessageSquare 
} from 'lucide-react'
import { useMobileDetection } from '@/hooks/useMobileDetection'
import { cn } from '@/lib/utils'

interface FooterMenuItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const menuItems: FooterMenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: Home,
  },
  {
    id: 'courses',
    label: 'Courses',
    href: '/courses',
    icon: BookOpen,
  },
  {
    id: 'earnings',
    label: 'Earnings',
    href: '/dashboard/earnings',
    icon: TrendingUp,
  },
  {
    id: 'blog',
    label: 'Blog',
    href: '/blog',
    icon: MessageSquare,
  },
  {
    id: 'profile',
    label: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
]

export function MobileFooterMenu() {
  const { isMobile } = useMobileDetection()
  const pathname = usePathname()

  if (!isMobile) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-gray-200 px-4 py-2 safe-area-pb"
    >
      <nav className="flex justify-around items-center max-w-md mx-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
            >
              <motion.div
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1',
                  isActive ? 'text-primary' : 'text-gray-500'
                )}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-primary/10 rounded-full"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
                
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10"
                >
                  <Icon 
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-primary' : 'text-gray-500'
                    )} 
                  />
                </motion.div>
                
                <span 
                  className={cn(
                    'text-xs font-medium transition-colors relative z-10',
                    isActive ? 'text-primary' : 'text-gray-500'
                  )}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </nav>
    </motion.div>
  )
}

// Hook to manage footer menu visibility
export function useMobileFooterMenu() {
  const { isMobile } = useMobileDetection()
  const pathname = usePathname()

  // Hide footer menu on certain pages
  const hiddenRoutes = [
    '/login',
    '/register',
    '/auth',
    '/admin',
  ]

  const shouldHideFooter = hiddenRoutes.some(route => pathname?.startsWith(route))

  return {
    shouldShowFooter: isMobile && !shouldHideFooter,
    footerHeight: isMobile && !shouldHideFooter ? '80px' : '0px',
  }
}